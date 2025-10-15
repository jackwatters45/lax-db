'use client';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function formatDate(date: Date | undefined) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !Number.isNaN(date.getTime());
}

export default function Calendar28() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    new Date('2025-06-01')
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  return (
    <div className="flex flex-col gap-3">
      <Label className="px-1" htmlFor="date">
        Subscription Date
      </Label>
      <div className="relative flex gap-2">
        <Input
          className="bg-background pr-10"
          id="date"
          onChange={(e) => {
            const date = new Date(e.target.value);
            setValue(e.target.value);
            if (isValidDate(date)) {
              setDate(date);
              setMonth(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          placeholder="June 01, 2025"
          value={value}
        />
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <Button
              className="-translate-y-1/2 absolute top-1/2 right-2 h-6 w-6"
              id="date-picker"
              size="icon"
              variant="ghost"
            >
              <CalendarIcon className="size-3" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            alignOffset={-8}
            className="w-auto overflow-hidden p-0"
            sideOffset={10}
          >
            <Calendar
              captionLayout="dropdown"
              mode="single"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setDate(date);
                setValue(formatDate(date));
                setOpen(false);
              }}
              selected={date}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
