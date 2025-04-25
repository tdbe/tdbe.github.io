---
published: true
layout: post
title: OpenXR Vulkan Gamedev Fundamentals
description: "OpenXR/Vulkan/C++ boilerplating single-pass Rendering, Input, and Gameplay fundamentals."
modified: 2023-02-24
tags: [vulkan, openxr, input, gamedev, khronos, C/C++, graphics programming, graphics pipeline, shader, geometry]
image:
  feature: abstract-10.jpg
  credit: dargadgetz
  creditlink: https://www.dargadgetz.com/ios-7-abstract-wallpaper-pack-for-iphone-5-and-ipod-touch-retina/
comments: true
share: true
---

# Open Source Boilerplate Project 

Still WIP

Documented here, and source code at: <a href="https://github.com/tdbe/openxr-vulkan-project-fundamentals">https://github.com/tdbe/openxr-vulkan-project-fundamentals</a>.

More OpenXR/Vulkan/C++ Gameplay, Input, and Rendering fundamentals, on top of @janhsimon's excellent timesaving openxr-vulkan-example.

Quickly make a performant XR game with common-sense gamedev principles. Explained; technical + friendly, conversational, human-speak tutorial style of how it's set up. Because there's quite a bit of evidence that khronos(openxr&vulkan) know not of what a hoo-man is. ??

# My feature stack so far:

## XR Locomotion
  - Mode: Rotating and accelerated Panning the scene by grabbing with both hands, and seeing a "tunnelvision" "external scene".
  - Uses state machines for movment and for visuals.

## Base XR gameplay mechanics
  - Mechanics system based on a list of `GameBehaviour`'s processed by Main's loop.
  - Each behaviour is Created (with its own required references), Updated (with frame & input data etc), and at the end Destroyed.
  - Sample mechanics for Locomotion, Hands, XR Input testing, World Objects.

## `GameData.h`
  - `GameObject`'s{`Material`, `Model`, Properties (e.g. `worldMatrix`, `isVisible`)}.
  - `PlayerObject`'s{`GameObject`'s, `PlayerActiveStates`}.
  - `Material`'s{`Shader`, Descriptor-set `UniformData`, optional/shared `Pipeline` (for e.g blend ops)}
  
## Rendering
  - Eplained in Janhsimon's Headset & Context classes, the easily confusing & hard to customize khronos vulkan + openxr implementation. Especially regarding multipass vs singlepass & multiview, and what it takes if you want to use your own renderer or a diffrent api like webgpu.
  - Explained and tweaked the `Renderer`/Pipeline; look for "// [tdbe]" 
  - Per-material, per-model, per-pipeline properties. Easily create a material e.g. transparent, doublesided; add uniforms / new shader etc.
  - Render pipeline knows if you modified any default properties in materials and in that case creates unique mats/pipelines.

## `Input` class and `InputData`'s in `Inputspace`.
  - "proper" xr input, supporting "all" controllers/headsetss, with customizable binding paths and action sets.
  - nicely accessible through `InputData` and `InputHaptics`.
  - poses for controllers and for head.
  - actions (buttons, sticks, triggers, pressure, proximity etc).
  - user presence / headset activity state.
  - haptic feedback output.
  - exposes matrixes, and xr action state data (e.g. lastChangeTime, isActive, changedSinceLastSync)

## `Utils` class
  - Some Utils for XR, input, and extra gamedev math/utils.

-------------------------------

# Below is Janhsimon's original readme:

-------------------------------

<!--a href="https://github.com/tdbe/openxr-vulkan-project-fundamentals/blob/c65157ae7a90b6db88209e83f67209a0bdece95e/teaser.gif">teaser.gif</a-->

# Overview

This project demonstrates how you can write your own VR application using OpenXR and Vulkan. These are its main features:

- Basic rendering of example scene to the headset and into a resizeable mirror view on your desktop monitor. 
- Focus on easy to read and understand C++ without smart pointers, inheritance, templates, etc.
- Usage of the Vulkan `multiview` extension for extra performance.
- Warning-free code base spread over a small handful of classes.
- No OpenXR or Vulkan validation errors or warnings.
- CMake project setup for easy building.

Integrating both OpenXR and Vulkan yourself can be a daunting and painfully time-consuming task. Both APIs are very verbose and require the correct handling of countless minute details. This is why there are two main use cases where this project comes in handy:

1. Fork the repository and use it as a starting point to save yourself weeks of tedious integration work before you get to the juicy bits of VR development.
2. Reference the code while writing your own implementation from scratch, to help you out if you are stuck with a problem, or simply for inspiration.

<a href="https://github.com/tdbe/openxr-vulkan-project-fundamentals">[...]</a>
