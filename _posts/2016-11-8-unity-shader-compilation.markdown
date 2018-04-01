---
published: true
layout: post
title: Unity Shader Compiling
description: "How shader programs are created and invoked under the hood."
modified: 2016-11-8
tags: [graphics programming, hlsl, cg, unity3d, shader, tutorial]
image:
  feature: abstract-3.jpg
  credit: dargadgetz
  creditlink: http://www.dargadgetz.com/ios-7-abstract-wallpaper-pack-for-iphone-5-and-ipod-touch-retina/
comments: true
share: true
---

I'm gonna briefly explain the standard for (Standard / Uber / Custom) Shader variant compilation (with specifics for unity3d).


##Here's a few top level scenarios you'd experience:

### You have a material with like 5 textures, what happens if you remove some of them at runtime? Is it more efficient?

### You want to create a material with any shader variant, programatically.

### You want to switch a shader from Opaque to Transparent at runtime.

And here's how it all works:

If you examine `StandardShaderGUI.cs` ([get it here](https://unity3d.com/get-unity/download/archive)), you see that a whole bunch of shit happens when you change a material setting. Things to look for:
	* `SetKeyword`	
	* `MaterialChanged`
	* `SetupMaterialWithBlendMode`
	* `Shader.EnableKeyword()`
	* `Shader.DisableKeyword()`
	
Shaders are text files that are typically full of compile time directives like this:
{% highlight glsl linenos %}
CGPROGRAM
#pragma compile_type _NORMALMAP //<- you define the keyword here
// can also be #pragma compile_type _DO_STUFF_ON _DO_STUFF_OFF _DO__OTHER_STUFF
// or #pragma compile_type __ _Do_STUFF_ON
// Replace "compile_type" with either "shader_feature" or "multi_compile". More on that further down.

#if defined(_NORMALMAP))
	tex2dlod(_NormalMap, uvw)
	//or
	tex2D(_NormalMap, uv)
	//etc.
#else
	//something else, or no else at all
#endif

//...

ENDCG
{% endhighlight %}
	
When you build the game, the engine goes through all your Materials and figures out what combination of settings they use, and parse and compile shader programs for each combination necessary. 

***Note:** Normally the HLSL or CG you write in an engine is interpreted and compiled through a bunch of internal engine layers and frameworks before it becomes "real" HLSL or "real" GLSL, Vulkan etc., according to the platform the build is for (pc/console etc). This is why for example Unity shaders have `CGPROGRAM` - that's just an interpreted keyword, and CG is a middle language.*
	
This means if in your scene you have a material with the standard shader with a _NormalMap, and one without, 2 shaders get created and are available at runtime.
	
HOWEVER. When you remove a texture at runtime from C#, you simply tell the shader it has values of 0 when it samples that textue. So you will need to also tell the Standard Shader or Uber Shader etc. to actually swap out that shader on the GPU for another:  `myMaterial.EnableKeyword("_NORMALMAP");`.

Same if you made a copy `newMat.CopyPropertiesFromMaterial(oldMat);`, or just a `newMat = new Material(Shader.Find("Standard"));` programatically. By default all keywords are disabled. (Or rather, if you see the multiple keywords on the same #pragma, the first one is used by default, and usually it would be a wildcard `__` or a `_NORMALMAP_OFF` before the `_NORMALMAP(_ON)`)

So one not-so-great strat would be to make sure you include in your scene the material variations you'll need in the build. A better but still not super maintainable one would be to include your variant materials in the Resources folder, which always gets included in the build.


An artist once pointed out to me that they can animate the shader type of a material, from Opaque to Transparent. That's funny because you can't do that (that easily). Again, if you look at `StandardShaderGUI.cs`, there's a lot of shit going on for switching modes:
{% highlight glsl linenos %}
switch (blendMode)
{
	case BlendMode.Opaque:
		material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.One);
		material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.Zero);
		material.SetInt("_ZWrite", 1);
		material.DisableKeyword("_ALPHATEST_ON");
		material.DisableKeyword("_ALPHABLEND_ON");
		material.DisableKeyword("_ALPHAPREMULTIPLY_ON");
		material.renderQueue = -1;
		break;
	case BlendMode.Cutout:
		material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.One);
		material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.Zero);
		material.SetInt("_ZWrite", 1);
		material.EnableKeyword("_ALPHATEST_ON");
		material.DisableKeyword("_ALPHABLEND_ON");
		material.DisableKeyword("_ALPHAPREMULTIPLY_ON");
		material.renderQueue = 2450;
		break;
	case BlendMode.Fade:
		material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
		material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
		material.SetInt("_ZWrite", 0);
		material.DisableKeyword("_ALPHATEST_ON");
		material.EnableKeyword("_ALPHABLEND_ON");
		material.DisableKeyword("_ALPHAPREMULTIPLY_ON");
		material.renderQueue = 3000;
		break;
	case BlendMode.Transparent:
		material.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.One);
		material.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
		material.SetInt("_ZWrite", 0);
		material.DisableKeyword("_ALPHATEST_ON");
		material.DisableKeyword("_ALPHABLEND_ON");
		material.EnableKeyword("_ALPHAPREMULTIPLY_ON");
		material.renderQueue = 3000;
		break;
}
{% endhighlight %}

So you'll have to make a script with the above code in it, and provided you have the correct shader variants included at runtime, you'll be able to switch a material from Opaque to Transparent or Cutout or Fade or whatever. This code also works for the Uber shader BTW.

<figure class="fill">
	<img src="https://vignette.wikia.nocookie.net/legendsofthemultiuniverse/images/b/b7/Uncle1.jpg" alt="JAckie Chan Adventures - Uncle 'One more thing'">
	<figcaption>One more thing</figcaption>
</figure>

There are actually 2 ways to compile different shader versions. When I wrote `compile_type` in `#pragma compile_type _NORMALMAP`, I lied. I meant: `#pragma shader_feature _NORMALMAP` or `#pragma multi_compile _NORMALMAP`. There's actually more stuff (like `multi_compile_fwdadd` or `UNITY_HARDWARE_TIER[X]`) ([read here](https://docs.unity3d.com/Manual/SL-MultipleProgramVariants.html)).

1). Shader Feature means when you build the game, the engine will only include the contents of a `#if something #endif` if it is used by the scene(s). You can see that in the unity Standard Shader source. 

The proper-ish way to include other variants for `shader_feature` shaders is to use the [Graphics Settings](https://docs.unity3d.com/Manual/class-GraphicsSettings.html) where in the Preloaded Shaders array you can drag in a preload shader collection file (make it rightclicking in the project panel) of the shader variant(s) you want.

I said "ish" because it's not technically the proper way but Unity isn't clear on what else to do [[details here](https://answers.unity.com/questions/1286653/best-practice-for-shaders-with-variants-and-asset.html)] (they probably don't have a proper solution implemented, it's Unity after all ;) - the engine where one unaffiliated programmer can do a better job at an entire rendering pipeline than an entire multinational corporation.. but years of bottled-up frustrations aside...).

2). Multi Compile means that every possible combination of the keywords you defined in the `#pragma`, will be generated in shader variant files and actually included in the build. This can explode to a big number! (unless it's just a small custom shader you've made)


### Conclusion:
Use `shader_feature`, use the Resources folder, or a shader preload collection, and multi-compile sparingly.


***Note:** Protip: "[ShaderVariantCollection](https://docs.unity3d.com/ScriptReference/ShaderVariantCollection.html) records which shader variants are actually used in each shader."*
