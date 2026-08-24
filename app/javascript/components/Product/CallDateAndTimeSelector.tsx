"use client";

import {
  addMinutes,
  compareAsc,
  differenceInMinutes,
  eachDayOfInterval,
  eachMinuteOfInterval,
  endOfDay,
  interval,
  isEqual,
  max,
  min,
  roundToNearestMinutes,
  startOfDay,
  subMinutes,
} from "date-fns";
import * as React from "react";

import { type CallAvailability, getRemainingCallAvailabilities } from "$app/data/call_availabilities";
import { formatCallDate } from "$app/utils/date";

import { Button } from "$app/components/Button";
import { LoadingSpinner } from "$app/components/LoadingSpinner";
import type { Option, Product } from "$app/components/Product/ConfigurationSelector";
import { Alert } from "$app/components/ui/Alert";
import { Calendar } from "$app/components/ui/Calendar";
import { Tab, Tabs } from "$app/components/ui/Tabs";
import { useRunOnce } from "$app/components/useRunOnce";

const getClientTimeZone = () => ({
  shortFormattedName: new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).format(new Date()).split(", ")[1],
  longFormattedName: new Intl.DateTimeFormat("en-US", { timeZoneName: "long" }).format(new Date()).split(", ")[1],
});

const roundToNearestDisplayTime = (time: Date) =>
  roundToNearestMinutes(time, { nearestTo: 30, roundingMethod: "ceil" });

const CallDateAndTimeSelector = ({
  product,
  selectedOption,
  selectedStartTime: rawSelectedStartTime,
  onChange,
}: {
  product: Product;
  selectedOption: Option;
  selectedStartTime: string | null;
  onChange: ({ callStartTime }: { callStartTime: Date | null }) => void;
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [availabilities, setAvailabilities] = React.useState<CallAvailability[]>([]);

  const clientTimeZone = getClientTimeZone();
  const callDurationInMinutes = selectedOption.duration_in_minutes ?? 0;
  const selectedStartTime = rawSelectedStartTime ? new Date(rawSelectedStartTime) : undefined;
  const lastAvailability = availabilities.length > 0 ? availabilities[availabilities.length - 1] : null;

  useRunOnce(() => void loadAvailabilities());
  React.useEffect(() => {
    if (isLoading) return;
    if (selectedStartTime && isStartTimeAvailable(selectedStartTime)) return;
    onChange({ callStartTime: firstAvailableStartTime });
  }, [selectedOption, availabilities]);

  const loadAvailabilities = async () => {
    setIsLoading(true);
    const availabilities = await getRemainingCallAvailabilities(product.permalink);
    setAvailabilities(availabilities);
    setIsLoading(false);
  };

  const availabilitiesByDate = React.useMemo(
    () =>
      availabilities.reduce<Record<string, typeof availabilities>>((byDate, availability) => {
        eachDayOfInterval(interval(availability.start_time, availability.end_time)).forEach((date) => {
          (byDate[date.toDateString()] ??= []).push(availability);
        });
        return byDate;
      }, {}),
    [availabilities],
  );

  const getAvailableStartTimesByDate = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const availabilities = availabilitiesByDate[date.toDateString()] ?? [];
    const startTimes: Date[] = [];

    for (const availability of availabilities) {
      const earliestStartTime = max([availability.start_time, dayStart]);
      const roundedEarliestStartTime = roundToNearestDisplayTime(earliestStartTime);
      const latestStartTime = min([subMinutes(availability.end_time, callDurationInMinutes), dayEnd]);

      if (earliestStartTime > latestStartTime) {
        continue;
      }
      if (roundedEarliestStartTime > latestStartTime) {
        startTimes.push(earliestStartTime);
      } else {
        startTimes.push(...eachMinuteOfInterval(interval(roundedEarliestStartTime, latestStartTime), { step: 30 }));
      }
    }

    return startTimes;
  };

  const firstAvailableStartTime = React.useMemo(() => {
    const ascendingAvailableDates = Object.keys(availabilitiesByDate)
      .map((date) => new Date(date))
      .sort(compareAsc);
    for (const availableDate of ascendingAvailableDates) {
      const times = getAvailableStartTimesByDate(availableDate);
      if (times[0]) {
        return times[0];
      }
    }
    return null;
  }, [callDurationInMinutes, availabilities]);

  const dateAvailabilityCache = React.useMemo<Record<string, Record<number, boolean>>>(() => ({}), [availabilities]);
  const isAvailableOnDate = (date: Date) => {
    const dateString = date.toDateString();
    const cached = dateAvailabilityCache[dateString]?.[callDurationInMinutes];
    if (cached) return cached;

    const dayStart = startOfDay(date);
    const isAvailable =
      availabilitiesByDate[dateString]?.some((availability) => {
        const availabilityStart = max([availability.start_time, dayStart]);
        return differenceInMinutes(availability.end_time, availabilityStart) >= callDurationInMinutes;
      }) ?? false;

    return ((dateAvailabilityCache[dateString] ??= {})[callDurationInMinutes] = isAvailable);
  };

  const isStartTimeAvailable = (startTime: Date) => {
    const endTime = addMinutes(startTime, callDurationInMinutes);
    return availabilitiesByDate[startTime.toDateString()]?.find(
      (availability) => availability.start_time <= startTime && endTime <= availability.end_time,
    );
  };

  const setSelectedDateFromReactCalendar = (date: Date) =>
    onChange({ callStartTime: getAvailableStartTimesByDate(date)[0] ?? null });

  if (firstAvailableStartTime === null && !isLoading) {
    return (
      <Alert role="status" variant="warning">
        {product.options.length > 1 ? "There are no available times for this option." : "There are no available times."}
      </Alert>
    );
  }

  return (
    <>
      <section>
        <h4
          style={{
            marginBottom: "var(--spacer-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Select a date</span>
          {isLoading ? <LoadingSpinner /> : null}
        </h4>
        <Calendar
          locale={{ code: "en-US" }}
          mode="single"
          selected={selectedStartTime}
          startMonth={firstAvailableStartTime ?? new Date()}
          endMonth={lastAvailability ? new Date(lastAvailability.end_time) : new Date()}
          disabled={(date) => !isAvailableOnDate(date)}
          onSelect={(date) => {
            if (date) setSelectedDateFromReactCalendar(date);
          }}
        />
      </section>
      {selectedStartTime ? (
        <section>
          <h4
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "var(--spacer-2)",
            }}
          >
            <span>Select a time</span>
            <span title={clientTimeZone.longFormattedName} suppressHydrationWarning>
              {clientTimeZone.shortFormattedName}
            </span>
          </h4>
          <Tabs variant="buttons" className="grid-cols-2 md:grid-flow-row" role="radiogroup">
            {getAvailableStartTimesByDate(selectedStartTime).map((time) => {
              const isSelected = isEqual(selectedStartTime, time);
              return (
                <Tab key={time.toISOString()} isSelected={isSelected} asChild>
                  <Button
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onChange({ callStartTime: time })}
                    className="justify-center"
                  >
                    <div>{formatCallDate(time, { date: { hidden: true }, timeZone: { hidden: true } })}</div>
                  </Button>
                </Tab>
              );
            })}
          </Tabs>
        </section>
      ) : null}
      {selectedStartTime ? (
        <div>
          <h4>
            You selected{" "}
            <strong>
              {formatCallDate(selectedStartTime, { date: { hideYear: true }, timeZone: { hidden: true } })}
            </strong>
          </h4>
        </div>
      ) : null}
    </>
  );
};

export default CallDateAndTimeSelector;
