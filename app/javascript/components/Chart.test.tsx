// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { ComposedChart, Line, XAxis, YAxis } from "recharts";
import { afterEach, describe, expect, it } from "vitest";

describe("chart dependency compatibility", () => {
  afterEach(cleanup);

  it("renders axes and series nested in a React fragment", () => {
    const { container } = render(
      <ComposedChart width={600} height={300} data={[{ day: "Monday", sales: 12 }]}>
        <>
          <XAxis dataKey="day" />
          <YAxis />
          <Line dataKey="sales" isAnimationActive={false} />
        </>
      </ComposedChart>,
    );

    expect(container.querySelectorAll(".recharts-cartesian-axis")).toHaveLength(2);
    expect(container.querySelectorAll(".recharts-line")).toHaveLength(1);
  });
});
