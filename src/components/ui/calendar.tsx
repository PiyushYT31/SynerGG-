"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Hide the default label
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Caption: ({ ...props }) => {
          const { goToMonth, displayMonth } = useNavigation();
          const { fromDate, toDate } = useDayPicker();

          const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newDate = new Date(displayMonth);
            newDate.setFullYear(parseInt(e.target.value, 10));
            goToMonth(newDate);
          };

          const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newDate = new Date(displayMonth);
            newDate.setMonth(parseInt(e.target.value, 10));
            goToMonth(newDate);
          };

          const years: number[] = [];
          const startYear = fromDate ? fromDate.getFullYear() : new Date().getFullYear() - 100;
          const endYear = toDate ? toDate.getFullYear() : new Date().getFullYear();
          for (let i = endYear; i >= startYear; i--) {
            years.push(i);
          }

          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          
          return (
            <div className="flex justify-center gap-2">
              <select
                onChange={handleMonthChange}
                value={displayMonth.getMonth()}
                className={cn(buttonVariants({ variant: "outline" }), "h-auto w-auto pr-8 text-sm font-medium")}
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              <select
                onChange={handleYearChange}
                value={displayMonth.getFullYear()}
                className={cn(buttonVariants({ variant: "outline" }), "h-auto w-auto pr-8 text-sm font-medium")}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
