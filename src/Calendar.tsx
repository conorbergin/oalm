import { Component, For } from "solid-js"

import { DateTime } from 'luxon'

// Get the last Monday of the previous year
const lastMondayOfYear = DateTime.local().minus({ years: 1 }).endOf('year').startOf('week').plus({ days: 0 });

// Get the first Sunday of the next year
const firstSundayOfYear = DateTime.local().plus({ years: 1 }).startOf('year').endOf('week').minus({ days: 0 });

// Generate all the dates between the last Monday and first Sunday
const datesArray: Array<{ month: number, date: number }> = [];
let currentDate = lastMondayOfYear;
while (currentDate <= firstSundayOfYear) {
    datesArray.push({ month: currentDate.month, date: currentDate.day });
    currentDate = currentDate.plus({ days: 1 });
}


export const CalendarView = (props) => {
    return (
        <div class="w-full h-full">
            2023
            <div class="grid grid-cols-7">
                <For each={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}>
                    {item => <div class="font-bold">{item}</div>}
                </For>
            </div>
            <div class="grid grid-cols-7 overflow-scroll w-full h-full border-t border-black">

                <For each={datesArray}>
                    {(item, index) => <div class="pb-10 border" classList={{
                        'text-red-600': item.month % 2 === 0,
                        'bg-gray-300': index() % 7 === 5 || index() % 7 === 6,
                    }}>{item.date}</div>}
                </For>
            </div>
        </div>
    )
}