---
published: true
layout: post
title: Graphics Pipeline fundamentals (Unity, OpenGL)
description: "Graphics Pipeline, spaces, coordinates, matrices, and different types of vertex, geometry, and fragment shaders."
modified: 2016-10-2
tags: [graphics programming, graphics pipeline, OpenGL, DirectX11, unity3d, matrix, shader, vertex, geometry, fragment, pcg, tutorial]
image:
  feature: abstract-11.jpg
  credit: dargadgetz
  creditlink: http://www.dargadgetz.com/ios-7-abstract-wallpaper-pack-for-iphone-5-and-ipod-touch-retina/
comments: true
share: true
---

In my graphics programming internets travels I noticed that a lot of people find it hard to grasp (or clearly explain) the graphics pipeline and some of the tricks you can do.

The general high level theory is simple, but the API naming or hidden math makes it tough in practice. It's confusing or incomplete even in academic material or nvidia's GPU Gems.

In this and the [next post](http://tdbe.github.io/unity-shader-shenanigans/), I'll explain for-realsies how a mesh (or a data buffer) gets converted throughout the graphics pipeline, and give some sample code for stuff like procedural geometry, reconstructing worldpsace position, or using custom data buffers.

This tutorial has some advanced stuff but is still accessible to noobs. It however assumes you've tinkered with shader code before, and know basic concepts like how there's triangle interpolation.





## The Mesh

First off, a Mesh is a class that stores various coordinate arrays in Object Space:

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

## The Graphics Pipeline

Terminology here is loose with many synonyms. I'll throw all of them in and clarify.

A mesh goes from **Object Space** (or Model Space) to **World Space** to **Camera Space** (or View Space or Eye Space) to **Projection Space** (**Clip Space**) to **Screen Space** (or Window Space).

The following is how virtually any graphics pipeline works, but I'm specifically writing it in CG terminology, with the UnityCG library in particular:

*Note: these matrixes are used starting with the **Vertex program**. The first 3 are merged into `UNITY_MATRIX_MVP`*.
<br/>
<br/>


### The Vertex Shader

* **M**odel->World is the World matrix (rotates, translates, scales vertices to their unity world position). Unity and OpenGL call it the Model matrix... But a less sadistic way to name it, for newcomers, would have been `MATRIX_WVP` not `_MVP`.

* World -> Camera is the **V**iew matrix. This just transforms coords so they are relative to the camera. They are in -1 (bottom-left) to 1 (top-right), with the camera at (0,0) and z between (-1 (close) and 1 (far)).

* Camera -> Clip space is the Perspective (or Orthographic (isometric)) **P**rojection Matrix. The projection matrix doesn't really do anything now. It just builds up the vertex for the next (perspective divide) step.

Here's how the Projection Matrix multiplication looks in Unity (it's the OpenGL standard):

|:--------:|:-------:|:--------:|:--------:|:--------:|:--------:|
| focalLength   | 0   | 0   | 0  |   		|	x		|
| 0   | focalLength /<br/>aspectRatio   | 0   | 0  | * 		|	y		|
| 0   | 0   | - (farPlane + nearPlane) /<br/>(farPlane - nearPlane)   |	-(2 * farPlane * nearPlane) /<br/>(farPlane - nearPlane)  |   		|	z		|
| 0   | 0   | -1   | 0		|   		|	1		|

The Projection Matrix above incorporates FoV, and the near and far planes.
<br/>
`focalLength = 1 / tan(FoV/2);`
<br/>
`aspectRatio = windowHeight / windowWidth;`

Check out [slide #6 here](http://www.terathon.com/gdc07_lengyel.pdf) for a nice visualisation. 

***Note:***
<ul>
	<ul style="margin-left: -2em; margin-top:-1em; font-style: italic;">
	<li>Unity will convert the above matrix to the appropriate API it's using when it compiles the shaders (e.g. DirectX).</li>
	
	<li>You can see or set the projection matrix with <a href="https://dl.dropboxusercontent.com/u/7761356/UnityAnswers/Code/ProjectionMatrixEditorWindow.cs">this editor script</a>.</li>
	
	<li>If you set custom projection matrices from C#, use the <a href="https://docs.unity3d.com/550/Documentation/ScriptReference/GL.GetGPUProjectionMatrix.html">GL.GetCPUProjectionMatrix</a>.</li>
	</ul>
</ul>


***Note:** Z is actually converted to 1/z (the inverse, or reciprocal of z). Z is not linear but 1/z is (this allows linear interpolation, and helps precision). <a style="border-bottom: 1px dotted #a2a2a2;" href="http://www.reedbeta.com/blog/2015/07/03/depth-precision-visualized/">Here's more</a> on why 1/z is used, and on the depth precision.*


<br/>

<figure class="half">
	<img src="http://i950.photobucket.com/albums/ad341/jekylljuice85/lobe%20gallery/relaxovision.png" alt="Freakazoid">
	<figcaption>Intermission</figcaption>
</figure>

Before we continue I must point out that up until now (and including Clip space (projection space)) all the coords were in what is called **Homogenous** space or Homogenous coordinates (4D): `vertex.xyz`w. 

Normally w is 1 in a vector. We need it because GPUs work with matrix multiplications. But matrix transforms are rotation, scale, and **translation** -- which is addition. So if you know your matrix math you know you can get addition out of matrix multiplication if you add a dimension:


|:--------:|:-------:|:--------:|:--------:|:--------:|:--------:|
| 1   | 0   | 0   | translateX  |   		|	x		|
| 0   | 1   | 0   | translateY  | * 		|	y		|
| 0   | 0   | 1   |	translateZ  |   		|	z		|
| 0   | 0   | 0   | 1			|   		|	1		|


Above we have a simple Translation matrix, multiplied by our `vertex.xyz`w. See why w needs to be 1? Also, obviously you can combine multiple matrices into one (e.g. don't just have 1s and 0s in our matrix above, maybe also include rotation and/or scale, or, say a `UNITY_MATRIX_MVP`).

After the Projection, w will be used for the perspective divide. The w will become z with this kind of matrix multiplication:

|:--------:|:-------:|:--------:|:--------:|:--------:|:--------:|
| 1   | 0   | 0   | 0  |   		|	x		|
| 0   | 1   | 0   | 0  | * 		|	y		|
| 0   | 0   | 1   |	0  |   		|	z		|
| 0   | 0   | 1   | 0  |   		|	1		|

<br/>
And we're back: 

***Note**: The following 3 steps are something that happens automatically, on the GPU (OpenGL and DirectX), immediately after the Vertex program.*

* Frustum Culling. This is not a matrix, it's a sampling operation. The vertex program outputs coordinates in Clip space. So the clip coordinates of `vertex.xyz` are each (x, y, and z) tested for beig within (`-vertex.w`, `vertex.w`). Basically if anything from is outside the frustum, it is not sampled (frustom culling).

* Clip -> NDC space is the perspective divide (by `vertex.w`). The frustum gets a perspective divide (distortion) (which is not [affine](https://en.wikipedia.org/wiki/Affine_transformation)), i.e is divided by w. Now the term we're at is we're in Normalized Device Coordinates. Then a couple of viewport and depth range tweaks are done and we're in Screen Space.
	* Even though we still have a w (and it's normalized to 1), we're not in homogenous corrds any more. If you were confused why the vertex2frag out structure's `.pos` attribute is a vector4, it's because the perspective divide happens just after the vertex program.
	* In OpenGL View and NDC space coordinates go between (-1,-1,-1) at bottom-left-back and (1,1,1) at top-right-forward. In Direct3D the z goes between 0 and 1 instead of -1 to 1.
	* The Z coordinate here goes into the Depth buffer, and/or encoded into the DepthNormals buffer. The depth in buffers is [0,1].
	* Since we've done our perspective projection, the Depth buffer **is not linear**. So you can't just do linear interpolation to fetch a depth point (I'll explain later when I get to ray examples).
<br/>
<br/>
* NDC space -> Screen space (Window space) (rasterization): Still after the Vertex and before the fragment, the GPU converts coords to viewport pixels. In other words, it transforms from Normalized Device Coordinates (or NDC) to Window Coordinates (raster pixels - fragments). 

The formula is x = 0.5 * (x+1) * screenWidth, y = 0.5 * (x+1) * screenHeight. The z is still between 0 and 1 from before.

If you want extra coords passed to the fragment in Screen space, you need to do the conversion to Screen space yourself in the vertex program (the auto conversion only applies to the `SV_POSITION`). Here's an example:

{% highlight glsl linenos %}
	v2f vert(vI v)
	{
		v2f o;

		o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
		//this will interpolate in the fragment to the up vector in world space for the geometry you are drawing:
		o.orientation = mul ((float3x3)_Object2World, float3(0,1,0));
		//this will interpolate in the fragment to the world position of the current geometry you're drawing:
		o.position_ws = mul(_ObjectToWorld, v.vertex);
		
		//o.uv = v.texcoord;
		//Say you want a screenspace ray instead of a TEXCOORD:
		o.uv = ComputeScreenPos(o.pos);
	}
{% endhighlight %}	
	
At this point our `o.pos` is converted to Clip space by `MVP`. So `ComputeScreenPos` is a cross-platform unityGC function that essentially takes the [-1,1] coordinates of your vertex and preps them for interpolation, setting the right w param for you to divide with once you get to the fragment. Then your uv will be within [0,1] in screenspace (0 is bottom left).

This is the divide in the fragment: `float2 screenUV = i.uv.xy / i.uv.w;`.

And if in the frag for some reason you would want `screenUV.uv` to be the same as `i.pos` (in pixels), you'd also need to multiply `screenUV.xy` by window width. But normally we do the opposite: we divide `i.pos.xy` by screen width and height to get (0,1) values.


<br/>



### The Geometry Shader

There's actually one more thing between vert and frag (and before the interpolation): <br/>the **Geometry program**. This optional step is where you can use affine transformations to create more vertices within a triangle, to tessellate your mesh.

You can also for ex have a mesh with verts that are just points, and use a Geometry program to spawn quad verts around those vertices and make billboards out of them. [Here is an example](http://forum.unity3d.com/threads/geometry-shaders.156553/) of just that.

Here's a subset of that shader. I'll explain the key points.

{% highlight glsl linenos %}
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

<span id="customVertex"></span>


In DirectX11 you can actually do the points-to-quads conversion trick directly in the vertex program by manipulating custom data buffers.

Here's how I did that for my [particle sculpter](http://www.deferredreality.com/?project=particles):
{% highlight glsl linenos %}

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


### The Fragment Shader

Now we've finally entered the **Fragment** program before which the GPU has also done linear and perspective-correct interpolation on the vertices (and on texcoords, color etc.) to give us the pixel positions for the triangles. 

Keep in mind that here you shouldn't multiply any point by a matrix, unless you make it homogenous (w=1 and also reverse the perspective divide (ie take it back to clip space)).

The classic fragment function is like this: <br/>
`fixed4 frag(v2f_struct i) : COLOR //or SV_Target`<br/>
This means this shader has 1 Render Target and it returns a rgba color.

The render target can be changed from C# with the Graphics or CommandBuffer API. (I'll show that later)

In the deferred renderer, you can actually have (the option to output to) multiple render targets (MRT). The function structure changes, we use (multiple) out parameters:
{% highlight glsl linenos %}
void fragDeferred (
	VertexOutputDeferred i,
	out half4 outDiffuse : SV_Target0,// RT0: diffuse color (rgb), occlusion (a)
	out half4 outSpecSmoothness : SV_Target1,// RT1: spec color (rgb), smoothness (a)
	out half4 outNormal : SV_Target2,// RT2: normal (rgb), --unused, very low precision-- (a) 
	out half4 outEmission : SV_Target3// RT3: emission (rgb), --unused-- (a)
)
{% endhighlight %}

Now let's continue from my vertex shader snippet from further above where I wanted a screenspace ray and did: `o.uv = ComputeScreenPos(o.pos);`.
<br/>Since it didn't get a perspective divide (because it couldn't have been interpolated to the fragment if it had), we need to do that now.
<br/> Fragment:
{% highlight glsl linenos %}
{
//a screenspace uv ray:
float2 uv = i.uv.xy / i.uv.w;
//as opposed to an object space uv ray (ie if you had done o.uv = v.texcoord; in the vertex):
//here i.uv would have sampled from 0 to 1 for each face of your cube etc.

//And now we can sample the color texture from what 
//is already rendered to the screen under the current pixel
float4 colBuff = tex2D(_CameraGBufferTexture0, uv);

float depth = tex2D(_CameraDepthTexture, uv);

//...
}
{% endhighlight %}

This `_CameraGBufferTexture0` is from the deferred renderer, but you can set custom textures to a shader using the Graphics or CommandBuffer Blit function, even in the forward stage.

<br/>

------


[**My next post**](http://tdbe.github.io/unity-shader-shenanigans/) will apply some of this knowledge in some common but unconventional uses for shaders.

After this hopefully everyone can start researching and understanding more fun stuff like clouds, atmospheric scattering, light absorbtion, glass caustics, distance fields, fluid simulations, grass, hair, skin etc..


<small>PS: There's quite a bit of in-depth pipeline stuff here. If anything's unclear, or I happened to cock anything up, let me know.</small>