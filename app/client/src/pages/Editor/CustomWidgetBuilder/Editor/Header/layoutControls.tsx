import { SegmentedControl } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";

export default function LayoutControls() {
  const context = useContext(CustomWidgetBuilderContext);

  const onChange = (value: string) => {
    context.selectLayout?.(value);
  };

  return (
    <div>
      <SegmentedControl
        onChange={onChange}
        options={[
          {
            label: "Split",
            startIcon: "layout-column-line",
            value: "split",
          },
          {
            label: "Tabs",
            startIcon: "layout-left-2-line",
            value: "tabs",
          },
        ]}
        value={context.selectedLayout}
      />
    </div>
  );
}
