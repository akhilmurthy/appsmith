import type { WidgetProps } from "widgets/BaseWidget";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { createZoneAndAddWidgets } from "./zoneUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call } from "redux-saga/effects";
import { severTiesFromParents, transformMovedWidgets } from "./moveUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import {
  addNewWidgetToDsl,
  getCreateWidgetPayload,
} from "../../widgetAdditionUtils";

export function* createSectionAndAddWidget(
  allWidgets: CanvasWidgetsReduxState,
  highlight: AnvilHighlightInfo,
  widgets: WidgetLayoutProps[],
  parentId: string,
) {
  /**
   * Step 1: Create Section widget.
   */
  const widgetId: string = generateReactKey();
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    addNewWidgetToDsl,
    allWidgets,
    getCreateWidgetPayload(widgetId, SectionWidget.type, parentId),
  );

  /**
   * Step 2: Extract canvas widget and section layout.
   */

  const sectionProps: FlattenedWidgetProps = updatedWidgets[widgetId];

  /**
   * Step 3: Add widgets to section. and update relationships.
   */
  const res: { canvasWidgets: CanvasWidgetsReduxState; section: WidgetProps } =
    yield call(
      addWidgetsToSection,
      updatedWidgets,
      widgets,
      highlight,
      sectionProps,
    );

  return res;
}

/**
 * Split widgets into two groups depending on their type === ZONE_WIDGET.
 * @param widgets | WidgetLayoutProps[] : List of dragged widgets.
 * @returns WidgetLayoutProps[][] : List of dragged widgets split by type.
 */
function splitWidgets(widgets: WidgetLayoutProps[]): WidgetLayoutProps[][] {
  const zones: WidgetLayoutProps[] = [];
  const nonZones: WidgetLayoutProps[] = [];
  widgets.forEach((widget: WidgetLayoutProps) => {
    if (widget.widgetType === ZoneWidget.type) {
      zones.push(widget);
    } else {
      nonZones.push(widget);
    }
  });
  return [zones, nonZones];
}

function addZoneToSection(
  canvasProps: WidgetProps,
  sectionLayout: LayoutProps,
  sectionComp: typeof BaseLayoutComponent,
  highlight: AnvilHighlightInfo,
  zone: WidgetLayoutProps,
) {
  /**
   * Step 1: Add zone widgetIds to canvas.children.
   */
  canvasProps.children = [...canvasProps.children, zone.widgetId];

  /**
   * Step 2: Add zone to section layout.
   */
  sectionLayout = sectionComp.addChild(sectionLayout, [zone], highlight);

  return {
    canvas: canvasProps,
    section: sectionLayout,
  };
}

export function* addWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  section: WidgetProps,
) {
  let canvasWidgets = { ...allWidgets };
  let sectionProps = { ...section };
  let sectionLayout: LayoutProps = section.layout[0];
  /**
   * Step 1: Split widgets into zones and non zones.
   *
   * Zone widgets are added to the section directly.
   *
   * Non zone widgets are added to a newly created Zone that gets inserted into the section.
   *
   * TODO: This doesn't handle the maxChildLimit of 4 for sections.
   * What to do if addition of new zones will lead to total zone count to be greater than 4?
   * Can this be prevent during DnD itself? i.e. Don't show highlights for sections that can't handle so many zones.
   */
  const [zones, nonZones] = splitWidgets(draggedWidgets);

  /**
   * Step 2: Add zones to the section layout.
   */
  const sectionComp: typeof BaseLayoutComponent = LayoutFactory.get(
    sectionLayout.layoutType,
  );

  zones.forEach((zone: WidgetLayoutProps) => {
    const res: { canvas: WidgetProps; section: LayoutProps } = addZoneToSection(
      sectionProps,
      sectionLayout,
      sectionComp,
      highlight,
      zone,
    );

    sectionProps = res.canvas;
    sectionLayout = res.section;
    // Update parent of the zone.
    canvasWidgets = {
      ...canvasWidgets,
      [zone.widgetId]: {
        ...canvasWidgets[zone.widgetId],
        parentId: sectionProps.widgetId,
      },
    };
  });

  /**
   * Step 3: Create new zone and add to section.
   */
  if (nonZones.length) {
    /**
     * 1. Create new zone.
     * 2. Add non zoned widgets to it.
     * 3. Add the new zone and canvas to canvasWidgets.
     */
    const data: { canvasWidgets: CanvasWidgetsReduxState; zone: WidgetProps } =
      yield call(
        createZoneAndAddWidgets,
        canvasWidgets,
        nonZones,
        highlight,
        sectionProps.widgetId,
      );

    sectionProps.children = [
      ...(sectionProps?.children || []),
      data.zone.widgetId,
    ];
    sectionLayout = sectionComp.addChild(
      sectionLayout,
      [
        {
          alignment: FlexLayerAlignment.Start,
          widgetId: data.zone.widgetId,
          widgetType: data.zone.type,
        },
      ],
      highlight,
    );
    canvasWidgets = data.canvasWidgets;
  }

  /**
   * Step 4: Update canvas widget with the updated preset.
   */
  sectionProps.layout = [sectionLayout];

  return {
    canvasWidgets: {
      ...canvasWidgets,
      [sectionProps.widgetId]: sectionProps,
    },
    section: sectionProps,
  };
}

export function* moveWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Step 1: Remove moved widgets from previous parents.
   */
  widgets = severTiesFromParents(widgets, movedWidgets);

  /**
   * Step 2: Get the new Section and its Canvas.
   */
  const { canvasId } = highlight;

  const section: FlattenedWidgetProps = widgets[canvasId];

  /**
   * Step 3: Add moved widgets to the section.
   */
  const { canvasWidgets } = yield call(
    addWidgetsToSection,
    widgets,
    transformMovedWidgets(widgets, movedWidgets, highlight),
    highlight,
    section,
  );

  return canvasWidgets;
}