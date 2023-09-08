import { Component } from 'solid-js'

export const Plus: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 8 2 v 12 M 2 8 h 12" stroke="currentColor" stroke-width="2" />
    </svg>
)

export const Minus: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 2 8 h 12" stroke="currentColor" stroke-width="2" />
    </svg>
)


export const Minus2: Component = () => (
    <svg class="w-4 h-1" viewBox="0 0 16 4">
        <path d="M 2 2 h 12" stroke="currentColor" stroke-width="2" />
    </svg>
)
export const Square: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16" >
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="black" stroke-width="2" />
    </svg>
)

export const Circle: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5" fill="none" stroke="black" stroke-width="2" />
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

export const Drag2: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <circle cx="5" cy="2" r="2" fill="currentColor" />
        <circle cx="5" cy="8" r="2" fill="currentColor" />
        <circle cx="5" cy="14" r="2" fill="currentColor" />
        <circle cx="12" cy="2" r="2" fill="currentColor" />
        <circle cx="12" cy="8" r="2" fill="currentColor" />
        <circle cx="12" cy="14" r="2" fill="currentColor" />
    </svg>
)

export const HalfDrag: Component = () => (
    <svg class="w-2 h-4" viewBox="0 0 8 16">
        <circle cx="5" cy="2" r="2" fill="currentColor" />
        <circle cx="5" cy="8" r="2" fill="currentColor" />
        <circle cx="5" cy="14" r="2" fill="currentColor" />
    </svg>
)


export const Pencil: Component = () => (
    <svg class="w-6 h-6" viewBox="0 0 16 16">
        <path d="M 8 1 l 4 8 l -4 2 l -4 -2 Z" fill="currentColor" />
        <path d="M 8 1 l 6 12 v 5  h -12 v -5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin='round' />
    </svg>
)

export const Eraser: Component = () => (
    <svg class="w-6 h-6" viewBox="0 0 16 16">
        <rect x="1" y="1" width="14" height="20" fill="none" stroke="currentColor" stroke-width="2" rx="2" />
        <path d='M 1 7 l  14 0' stroke='currentColor' stroke-width='1'/>
    </svg>
)

export const Finger: Component = () => (
    <svg class="w-4 h-4" viewBox="0 0 16 16">
        <path d="M 0 0 l 16 16" stroke="currentColor" stroke-width="2" />
    </svg>
)

export const Exit: Component = () => (
    <svg class="w-6 h-6" viewBox='0 0 16 16'>
        <path d='M 1 1 l 14 14' stroke='currentColor' stroke-width='2'/>
        <path d='M 1 15 l 14 -14' stroke='currentColor' stroke-width='2'/>
    </svg>
)