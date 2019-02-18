---
published: true
layout: post
title: Write to custom data structures from within shaders
description: "Bake to rendertextures & write to structured buffers."
modified: 2018-06-17
tags: [tutorial, graphics programming, graphics pipeline, hlsl, cg, unity3d, shader]
image:
  feature: abstract-7.jpg
  credit: dargadgetz
  creditlink: http://www.dargadgetz.com/ios-7-abstract-wallpaper-pack-for-iphone-5-and-ipod-touch-retina/
comments: true
share: true
---

You probably know that you can assign and write to render textures and 3D textures and even custom data buffers like `RW Structured Buffers` from Compute Shaders. These can hold spatial information trees, distance fields, flow maps, points, meshes etc. (For more reading look up UAVs (Unordered Access Views), SRV (Shader Resource Views), and shader Resource Binding registers.)

But with shader model 5.0 and d3d11 you can now do more or less the same in regular vertex fragment shaders. This is great because it allows you to easily bake data onto mesh textures or atlasses while they're being rendered to screen anyway.


It's got such a cool range of possibilities, that you can even do dumb simple stuff like sample the shader's color under your mouse cursor, from inside the shader, and write it from inside the shader to a struct that you can simultaneously read back in C#, with no need to iterate through pixels or have access to any textures or anything like that.


So I'm'a show you how to UAV in unity shaders.


### Number 1: Constructing Render Targets

Your shader will have a `RWTexture2D` (or even 3D if you wanna get fancy and bake some point clouds):

{% highlight glsl linenos %}
CGINCLUDE
#ifdef _ALSO_USE_RENDER_TEXTURE
	#pragma target 5.0
	uniform RWTexture2D<half4> _MainTexInternal : register(u2);
	
	sampler2D sp_MainTexInternal_Sampler2D;
	float4 sp_MainTexInternal_Sampler2D_ST;
#endif
//... other stuff
ENDCG
{% endhighlight %}

The `register(u2)` represents which internal gpu registrar to bind the data structure to. You need to specify the same in C#, and keep in mind this is global on the GPU.

Now you can use this `_MainTexInternal` as if it was a 2D array in your shader. Which means it will take `int`s as coords like so `_MainTexInternal[int2(10,12)]` - which means it won't be filtered / smooth. However, you can form C# assign this same RenderTexture as a regular Sampler2D texture in the material/shader, with `material.SetTexture` as you would with any other texture, and then you can read from it with regular UVs.

So now let's create that render texture in C# and assign it to the material. Do this in a `ConstructRenderTargets()` and call it from something like `Start()`.

{% highlight glsl linenos %}
if(m_MaterialData.kw_ALSO_USE_RENDER_TEXTURE)
{
	m_paintAccumulationRT = new RenderTexture(rtWH_x, rtWH_y, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Linear);// Must be ARGB32 but will get automagically treated as float or float4 or int or half, from your shader code declaration.
	m_paintAccumulationRT.name = _MainTexInternal;
	m_paintAccumulationRT.enableRandomWrite = true;
	m_paintAccumulationRT.Create();
	
	m_MaterialData.material.SetTexture(m_MaterialData.sp_MainTexInternal, m_paintAccumulationRT);
	m_MaterialData.material.SetTexture(m_MaterialData.sp_MainTexInternal_Sampler2D, m_paintAccumulationRT);
	Graphics.ClearRandomWriteTargets();
	Graphics.SetRandomWriteTarget(2, m_paintAccumulationRT);//with `, true);` it doesn't take RTs
}
{% endhighlight %}

On that last line above, note the nuber 2. That's the register index from the shader. So `register(u2)` corresponds to 2 here.


### Number 2: Constructing Data Buffers

Let's just create an array of some arbitrary MyStruct, that will exist in both the shader and in C#.

{% highlight glsl linenos %}
CGINCLUDE
#ifdef _ALSO_USE_RW_STRUCTURED_BUFFER
	#pragma target 5.0 // no need to re-declare this directive if you already did it 
	
	struct MyCustomData
	{
		half3 something;
		half3 somethingElse;
	}
	uniform RWStructuredBuffer<MyCustomData> _MyCustomBuffer : register(u1);
#endif
//... other stuff
ENDCG
{% endhighlight %}

So `RWStructuredBuffer<MyCustomData>` is our buffer. It has some limits of what can go inside, and it's not 100% the C standard. But it's still really useful and can hold tons of entries or just a few (as much as a texture, or as much as memory allows).

Now let's construct the Compute Buffer in C#. Do this in a `ConstructDataBuffers()` and call it from somehting like `Start()`.

{% highlight glsl linenos %}
//Needs to be defined the same as in the shader.
public struct MyCustomData
{
	Vector3 something;
	Vector3 somethingElse;
}
MyCustomData[] m_MyCustomDataArr;

void ConstructDataBuffers()
{
	if(m_MaterialData.kw_ALSO_USE_RW_STRUCTURED_BUFFER)
	{
		int memalloc = 24;
		m_MyCustomComputeBuffer = new ComputeBuffer(bufferLength, memalloc);//stride == sizeof(MyCustomDataStruct)
		Graphics.SetRandomWriteTarget(1, m_MyCustomComputeBuffer, true);
		m_MaterialData.material.SetBuffer(m_MaterialData.sp_MyCustomBuffer, m_MyCustomComputeBuffer);
		
		m_MyCustomDataArr = new MyCustomData[bufferLength];
	}
}
{% endhighlight %}

If y'all know how to iterate through memory and whatnot, you know what that memalloc value is for. It's the size of the struct in bytes. A float3 is 12 bytes, and the structure I created in the shader has 2 half3's which equal to 1x float3 :) In the C# side, we don't have half3s but we can define it as Vector3 which is resolved to float3 and is bound as a half3 on the GPU in our case.


Now to do stuff with the data of this struct from C#. Do this in `Update()` if you want/need, it's fine.

{% highlight glsl linenos %}
void ProcessData(){
	if(m_MaterialData.kw_ALSO_USE_RW_STRUCTURED_BUFFER)
	{
		//here's how to read back the data from the shader
		m_MyCustomComputeBuffer.GetData(m_MyCustomDataArr);//obviously this way you will loose all the values you had in the array beforehand
		
		m_MyCustomDataArr[10].something = new Vector3(1,0,1);
		
		//now set it back to the GPU
		m_MyCustomComputeBuffer.SetData(m_MyCustomDataArr);
	}

}
{% endhighlight %}

Now to do stuff with this data buffer on the shader side:
{% highlight glsl linenos %}
// somewhere in vert or in frag or in a geometry function or wherever:
_MyCustomBuffer[my1DCoorinate].somethingElse = half3(0,1,0);
{% endhighlight %}

Done! Now go do cool stuff. And show me.

----

<iframe width="560" height="315" src="//www.youtube.com/embed/NVLIyvMUsTs" frameborder="0"> </iframe>

One of the things I did with this technique was a mesh painter where I have a custom SDF (signed distance field) volume to represent a 3D spray volume function intersecting with the world position on the fragment of the mesh I'm drawing on (both front and back so it can pierce through objects if I need to etc). You can also use an atlassed UV (like the lightmap UV) so you can have your RT as a global atlas and paint on multiple objects.

But you need to keep in mind that the object will be rendered from the PoV of the camera, and so it might not hit fragments/pixels that are at grazing angles, resulting in grainy incomplete results depending on the mesh and angle. But you can fix that either by doing the rendering with a different camera, or by unwrapping the mesh in a hidden pass, or just using compute shaders.

You can also do this whole thing but with Command Buffers and DrawMesh instead of Graphics.Set... I've done this a couple of times using Compute Shaders, but with the 5.0 vert frag shaders I [had issues](https://forum.unity.com/threads/using-rwtexture2d-float4-in-vertex-fragment-shaders.531872/) getting unity's API to work last I tried.

So perhaps another blog post should be about how to set up command buffers and compute shaders, and how to do something cool like turn a mesh into a pointcloud and do cool ungodly things to it :)

