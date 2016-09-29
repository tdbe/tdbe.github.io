---
published: true
layout: post
title: Pipeline and tricks for custom (Unity) Shaders
description: "Unity shader writing tricks"
modified: 2016-09-29
tags: [graphics programming, command buffer, unity3d, matrix, shader, vertex, geometry, fragment, tutorial]
image:
  feature: abstract-11.jpg
  credit: dargadgetz
  creditlink: http://www.dargadgetz.com/ios-7-abstract-wallpaper-pack-for-iphone-5-and-ipod-touch-retina/
comments: true
share: true
---

In my graphics programming internets travels I noticed that a lot of people find it hard to grasp the pipeline of custom shaders and some of the tricks you can do.

I'll explain the concepts behind how a mesh (or a data buffer) gets converted throughout the shader and on to the screen, and give some sample code for stuff like procedural geometry, reconstructing worldpsace position, or using custom data buffers.

This post assumes you've tinkered with shader code before, and know basic stuff like how there is triangle interpolation, and to set your variables, buffers, textures.

<br/>

------

##The Mesh

First off, a Mesh is a class in that stores various coordinates in Object Space:

* An array of vertices.
	* ex: A quad can have least 4 verts: `{-1,1,0.5},{1,1,0.5},{1,-1,0.5},{-1,-1,0.5}` (clockwise notation, from top left)

* An array of triangles that holds index values from the vertex array. Every 3 values represent a triangle.

	* in our ex with 4 verts you'll reference each vertex once or twice: `{0,1,2,2,3,0}`

		* ***Note**: If you need to split the quad tris apart in the shader for a distortion effect, you will have to create 6 verts instead of 4.*

* An array of normals. Each vertex has a corresponding normal (e.g. `Vector3(-1,1,-1)`).

	* For our quad example we will have only 1 normal per corner! 

		* ***Note**: Same as for triangles, if you need to process your mesh normals to tweak its smoothing, you will need more vertices (to double, triple etc. the normals)! Meshes you get from artists will (should) have this covered.*

* An array of UVs (texture coords). These start at (0,0) for top left and end at (1,1) in bottom right.

	* *Minor **Note**: If you've ever wondered how to get your `sampler2D _MainTex` in your shader to respond to the Inspector's material texture Scale and Offset, you need to declare a `float4 _MainTex_ST;`. `_MainTex_ST.xy` is Scale.xy, and `_MainTex_ST.zw` is Offset.xy.*

<br/>

------

##Pipeline of a Shader

Terminology here is loose with many synonyms. I'll throw all of them in and clarify.

A mesh goes from **Object Space** (or Model Space) to **World Space** to **Camera Space** (or View Space or Eye Space) to **Clip Space** to **Screen Space** to **Window Space**.

The following is how virtually any graphics pipeline works, but I'm specifically writing it in Unity CG terminology:

*Note: these matrixes are used starting with the **Vertex program**. The first 3 are merged into `UNITY_MATRIX_MVP`*
<br/>
<br/>


###The Vertex Shader

* Model->World is the World matrix (rotates, translates, scales vertices to their unity world position). Unity calls it the Model matrix... I know, a less sadistic engine would have unconfusingly named it `MATRIX_WVP` not `_MVP`.

* World -> Camera is the View matrix (this is the square frustum, no clipping, no perspective divide; coords are in -1 to 1 (in unity coords), relative to camera)

* Camera -> Clip is the Projection Matrix. Well, actually it's the Clip matrix. (Here everything is clipped to those bounds ([Here's how the matrix looks](http://answers.unity3d.com/questions/1070406/difference-between-vertexz-and-posw-in-mvp-space.html)) ([check basics of the frustum here](http://http.developer.nvidia.com/CgTutorial/cg_tutorial_chapter04.html))). BTW This is another instance of sadistic naming since it's the Clip matrix not the Projection matrix. So the matrix should be called `UNITY_MATRIX_WVC`.


<figure class="half">
	<img src="http://i950.photobucket.com/albums/ad341/jekylljuice85/lobe%20gallery/relaxovision.png" alt="Freakazoid">
	<figcaption>Intermission</figcaption>
</figure>

Before we continue I must point out that up until now all the coords were in what is called **Homogenous** space or Homogenous coordinates (4D): point.xyzw. 

Normally w is 1 in a vector. We need it because GPUs work with matrix multiplications. But matrix transforms are rotation, scale, and **translation** -- which is addition. So if you know your matrix math you know you can get addition out of matrix multiplication if you add a dimension:


|:--------:|:-------:|:--------:|:--------:|:--------:|:--------:|
| 1   | 0   | 0   | translateX  |   		|	x		|
| 0   | 1   | 0   | translateY  | * 		|	y		|
| 0   | 0   | 1   |	translateZ  |   		|	z		|
| 0   | 0   | 0   | 1			|   		|	1		|


Above we have a simple Translation matrix, multiplied by our point.xyzw. See why w needs to be 1? Also, obviously you can combine multiple matrices into one (e.g. don't just have 1s and 0s in our matrix above, maybe also include rotation and/or scale, or, say a `UNITY_MATRIX_MVP`).

BUT, w at this point in the pipeline, will be hijacked for the perspective divide (explained below). Our w will become z with this matrix mult:

|:--------:|:-------:|:--------:|:--------:|:--------:|:--------:|
| 1   | 0   | 0   | 0  |   		|	x		|
| 0   | 1   | 0   | 0  | * 		|	y		|
| 0   | 0   | 1   |	0  |   		|	z		|
| 0   | 0   | 1   | 0  |   		|	1		|

<span style="display:none;">
*Minor Note: [this wonderful chap](http://www.tomdalling.com/blog/modern-opengl/explaining-homogenous-coordinates-and-projective-geometry/) also points out that when w == 0, then an object is at infinity, and cannot be transformed from homogenous space coords to 3d space coords (divide by 0). And this is traditionally the way you check whether you're currently processing a point light (w=1) or a directional light (w=0).*
</span>

And we're back: 

* Clip -> Screen is the actual Projection matrix. But it's something that happens automatically, on the GPU, immediately after the Vertex program. The frustum gets a perspective divide (distortion) (which is not [affine](https://en.wikipedia.org/wiki/Affine_transformation)), i.e is divided by w. Now the term we're at is we're in Normalized Device Coordinates. Then a couple of viewport and depth range tweaks are done and we're in Screen Space.
	* Even though we still have a w, we're not in homogenous corrds any more. If you're confused why the vertex2frag out structure's `.pos` attribute is a vector4, it's because the perspective divide happens just after the vertex program, but the w is of no use in the fragment program.
	* In OpenGL Screen space's coordinates go between (-1,-1,-1) and (1,1,1). In Direct3D the z goes between 0 and 1.
	* The Z coordinate here goes into the Depth buffer, and/or encoded into the DepthNormals buffer. The depth in buffers is [0,1].
	* Since we've done our perspective projection, the Depth buffer **is not linear**. So you can't just do linear interpolation to fetch a depth point (I'll explain later).
	
* Screen -> Window: Still after the Vertex and before the fragment, the GPU converts coords to viewport pixels. In other words, it transforms from Normalized Device Coordinates (or NDC) to Window Coordinates. 

The formula is x = 0.5 * (x+1) * screenWidth, y = 0.5 * (x+1) * screenHeight. The z is still between 0 and 1 from before.

If you want extra coords passed to the fragment in Screen space, you need to do the conversion to Screen space yourself in the vertex program (the auto conversion only applies to the `SV_POSITION`). Here's an example:

{% highlight glsl %}
	v2f vert(vI v)
	{
		v2f o;

		o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
		o.orientation = mul ((float3x3)_Object2World, float3(0,1,0));
		
		//o.uv = v.texcoord;
		//Say you want a screenspace ray instead of a TEXCOORD:
		o.uv = ComputeScreenPos(o.pos);
	}
{% endhighlight %}	
	
At this point our `o.pos` is converted to Clip space by `MVP`. So `ComputeScreenPos` is a cross-platform unityGC function that essentially takes the [-1,1] coordinates and converts them to [0,1] in screenspace (0 is bottom left).
If you want `i.uv` to be the same as `i.pos`, you'd also need to multiply i.uv.xy by window width in pixels.

<br/>



###The Geometry Shader

There's actually one more thing between vert and frag (and before the interpolation): <br/>the **Geometry program**. This optional step is where you can use affine transformations to create more vertices within a triangle, to tessellate your mesh.

You can also for ex have a mesh with verts that are just points, and use a Geometry program to spawn quad verts around those vertices and make billboards out of them. [Here is an example](http://forum.unity3d.com/threads/geometry-shaders.156553/) of just that.

Here's a subset of that shader. I'll explain the key points.

{% highlight glsl %}
//GS_INPUT - is the data structure that the Vertex shader outputs. We are getting just one 
//point at a time in this geometry shader, but we could get more (you'd need 3 for 
//tessellation).
//TriangleStream<FS_INPUT> - this is a list of the data structure (the vertex output) that we
//want interpolated and sent to the Fragment shader. The GPU will interpolate between them 
//like they were regular triangles from a mesh.
void GS_Main(point GS_INPUT p[1], inout TriangleStream<FS_INPUT> triStream)
{
	float3 up = float3(0, 1, 0);
	float3 look = _WorldSpaceCameraPos - p[0].pos;
	look.y = 0;
	look = normalize(look);
	float3 right = cross(up, look);
	
	float halfS = 0.5f * _Size;
	
	float4 v[4];
	//The point we get from the vertex shader is in world space
	//we use that as the centre of the quad and create new worldspace vertex positions
	v[0] = float4(p[0].pos + halfS * right - halfS * up, 1.0f);
	
	//...
	
	//Matrix math! _World2Object is the inverse of the M matrix (object to world)
	//Multiplying the builtin MVP matrix by it gives us a UNITY_MATRIX_VP
	float4x4 vp = mul(UNITY_MATRIX_MVP, _World2Object);
	FS_INPUT pIn;
	pIn.pos = mul(vp, v[0]);
	pIn.tex0 = float2(1.0f, 0.0f);
	//Here's where we append a point (or, rather, 4) to the global triangle stream.
	triStream.Append(pIn);	
	
	//...
}
{% endhighlight %}	

In DirectX11 you can actually do the points-to-quads conversion trick directly in the vertex program by manipulating custom data buffers.

Here's how I did that for my [particle sculpter](http://www.deferredreality.com/?project=particles):
{% highlight glsl %}

struct Particle
{
	float3 position;
	//... and other stuff
}

// The buffer holding the particles. This Particle struct is also defined in C#,
// and is initialized from there using something like computeBuffer.SetData(arrayOfParticle);
StructuredBuffer<Particle> particleBuffer;

// The small buffer holding the 4 vertices for the billboard. Again, allocated and set from C#.
StructuredBuffer<float3> quad_verts;

// A custom DX11 vertex shader. Params come from Graphics.DrawProcedural(MeshTopology.x, n, particleCount); from C#.
// SV_VertexID: "n", the number of vertices to draw per particle, can make a point or a quad etc..
// SV_InstanceID: "particleCount", number of particles.
FragInput vert (uint id : SV_VertexID, uint inst : SV_InstanceID)
{
	FragInput fragInput = (FragInput)0;
	//When set up this way, the vertex program knows to run n times for the same particle point ("vertex") in the particle buffer.
	// Which means all we need to do is offset the current vertex according to our quad topology.
	float3 oPos = particleBuffer[inst].position + mul(unity_WorldToObject, mul(unity_CameraToWorld, quad_verts[id]));
	// Now we just do the standard conversion from Object to Clip space like it was any regular mesh vertex.
	fragInput.position = mul(UNITY_MATRIX_MVP,float4(oPos,1));
	return fragInput;
}
{% endhighlight %}	

The geometry shader example was calculating the camera space directions and then creating the new offsetted vertex point's position based on those.
What I did above was I treated my `quad_vert` like it was in camera space not object space (thus automatically aligning it to the camera), and then converting it from Camera (or View) to World space, and then from World to Object space. (even though the C# struct was of a stantard object space quad). Just another way to do it.

<br/>


###The Fragment Shader

Now we've finally entered the **Fragment** program before which the GPU has also done linear and perspective-correct interpolation on the vertices (and on texcoords, color etc.) to give us the pixel positions for the triangles. 

Keep in mind that here you shouldn't multiply any point by a matrix, unless you make it homogenous (w=1 and also reverse the perspective divide).

*This is running rather long, but I'll come back with some fragment tricks soon*