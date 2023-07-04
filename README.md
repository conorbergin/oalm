# Structure

```
!       inscription     the main text of section or para node
$       content         the child nodes of a section or para
&       children        the subsections of a node

d       duration        the predicted duration
e       end             the end of an item

h       header          table header
i       items           table items
```

# Task managment

The too simplist task management atoms/labels are todos and due dates. Due dates are things which must happen before a date, because of external contracts, and todos have no set date, but shoudl indicate a priority. In the GTD system the priority is indicated by a vague time, such as NEXT, SOON, SOMEDAY. These could be interspersed with true dates, SOON could mean in a week or in 3 months depending on the number and predicted duration of the tasks. THe final goal would be an autmatically generated, timeboxed schedule that takes a todo list/calandar as input.

What are the minimum requirements to achieve such a thing? Can we extend this system to multiple people?

Each person would need their own schedule, sleep blcked out obviously. Each accout should probably have a global calendar, to stop an individual double booking stuff. I also need some way of managing different encryption keys, maybe with a crdt.


Shoud tasks have dependancies? The tree stucture allows dependancies as is, but a linear process would be annoying to model. How does this tie in with a set of tasks with the same linear process i.e. photograph, list, sell

Each node needs a due date which can be a real date or a fuzzy date like 'soon' or 'next' or 'someday' (this also acts as a priority)

When a task is done it is crossed out, if it is in progross it can have subtasks which can each be marked as done, if it is blocked or waiting, a subtask can be aded saying this.

If we have multiple people on the same document, we need some way of assigning tasks (or do we?), tags might suffice.


The duration attribute is necessary for time blocking, it should be optional if the user just wants to have a basic todo list.

# Calendar / Agenda

- Displays important dates like christmas
- Deadlines
    date
- At conference vevery day for four days in x place
    begin date
    end date
    hours per day - these could be sub events with stsrt and end time
- At the gym every tueday and thursday from 7-9pm
    each instance could be a paragraph that auto inserts
- Want to call A this week
- Project deliverabe due this friday


# Grid / Table / Spreadsheet / Database
These are all similar but different. Ideally we would have just one abstraction.

Tables come in two flavours. The most ubiquitous is rows of individuals and a header with the attribute names. The other type is a comparison table, which is essentially a heat map, which is a chart, so I'm not sure it is even worth supporting. It is a undirectd graph fundamentally, and would need a different node type all ogether.

A spreadsheet is completely freeform, and is a visual programming environment, not worth supporting.

A relational database is like a table.

Do we need to integrate task management with this table type?

A tag system could implement a database.

# References

Links are easy, just use a standard format like [label][url]
Internal references will require a reandomly generated id, [big-red-cat] or something.
citations will need some sort of bibtext/zotero integration

# foot notes and endnotes
footnotes and endnotes will need their own syntax. myabe :f{} and :e{} 

# Metadata
Author(s), date etc.

# Equations and diagrams
I think the easiest way to do this is to support latex and mermaid, both proven dsls. A wysiwyg equation editor is more trouble than its worth

# Code
for equaitons and code snippets we need a pre environment that supports basic text editing. Codemirror would obviously have great ootb support.

Code execution is an interesting idea, but it is probably worth keeping this project turing incomplete, so I can reason about is complexiy.
