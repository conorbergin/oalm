import {Component } from 'solid-js'

export const Plus: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 8 0 v 16 M 0 8 h 16" stroke="currentColor" stroke-width="2" />
    </svg>
)

export const Minus: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 0 8 h 16" stroke="currentColor" stroke-width="2" />
    </svg>
)

export const Square: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16" >
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="black" stroke-width="2" />
    </svg>
)

export const Circle: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill="none" stroke="black" stroke-width="2" />
    </svg>
)

export const Triangle: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <polygon points="8,1 15,15 1,15" fill="none" stroke="black" stroke-width="2" />
    </svg>
)

export const Drag: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 0 4 h 16 M 0 8 h 16 M 0 12 h 16" stroke="currentColor" stroke-width="2" />
    </svg>
)


export const Pencil: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 8 1 l 4 8 l -4 2 l -4 -2 Z" fill="currentColor" />
        <path d="M 8 1 l 6 12 v 5  h -12 v -5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin='round'/>
    </svg>
)

export const Eraser: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <rect x="1" y="1" width="14" height="20" fill="none" stroke="currentColor" stroke-width="2" rx="2" />
    </svg>
)

export const Finger: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 0 0 l 16 16" stroke="currentColor" stroke-width="2" />
    </svg>
)