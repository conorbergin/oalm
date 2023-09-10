# Org à la Mode
A structured note taking app built with Yjs and inspired by org-mode

# Structure

Every section has a title, content and children.

# Tasks and Events

Oalm distiguishes between things with set dates, such as deadlines, meetings or holidays, and things that are less well defined such as buying milk, or cleaning your bicycle. More complex task management can be achieved by nesting tasks, the root task can have an explicit deadline, and the children will be arranged by their estimated duration and priority.

These events then appear in the Calendar view.


# Text editing
<Enter> creates a new node, <Shift+Enter> creates a line break. Bold, italic  and code are created by wrapping the text in asterisks, underscores and backticks. Links are created by wrapping the text in square brackets. 


# Equations and diagrams
I think the easiest way to do this is to support latex and mermaid, both proven dsls. A wysiwyg equation editor is more trouble than its worth

# Code
for equaitons and code snippets we need a pre environment that supports basic text editing. Codemirror would obviously have great ootb support.

Code execution is an interesting idea, but it is probably worth keeping this project turing incomplete, so I can reason about is complexiy.
