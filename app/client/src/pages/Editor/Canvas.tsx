import log from "loglevel";
import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";
import useWidgetFocus from "utils/hooks/useWidgetFocus";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getViewportClassName } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import type { FontFamily } from "@design-system/theming";
import {
  ThemeProvider as WDSThemeProvider,
  useTheme,
} from "@design-system/theming";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

interface CanvasProps {
  widgetsStructure: CanvasWidgetStructure;
  pageId: string;
  canvasWidth: number;
  enableMainCanvasResizer?: boolean;
  scale?: number;
}

const Wrapper = styled.section<{
  background: string;
  width: number;
  $enableMainCanvasResizer: boolean;
  $scale?: number;
}>`
  background: ${({ background }) => background};
  width: ${({ $enableMainCanvasResizer, width }) =>
    $enableMainCanvasResizer ? `100%` : `${width}px`};
  height: 100%;
  transform: ${({ $scale }) => ($scale ? `scale(${$scale})` : "")};
`;
const Canvas = (props: CanvasProps) => {
  const { canvasWidth, scale } = props;
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const selectedTheme = useSelector(getSelectedAppTheme);
  const isWDSV2Enabled = useFeatureFlag("ab_wds_enabled");
  const layoutSystemType: LayoutSystemTypes = useSelector(getLayoutSystemType);

  const { theme } = useTheme({
    borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
    seedColor: selectedTheme.properties.colors.primaryColor,
    fontFamily: selectedTheme.properties.fontFamily.appFont as FontFamily,
  });

  /**
   * background for canvas
   */
  let backgroundForCanvas;

  if (isPreviewMode || isAppSettingsPaneWithNavigationTabOpen) {
    if (isWDSV2Enabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = "initial";
    }
  } else {
    if (isWDSV2Enabled) {
      backgroundForCanvas = "var(--color-bg)";
    } else {
      backgroundForCanvas = selectedTheme.properties.colors.backgroundColor;
    }
  }

  const focusRef = useWidgetFocus();
  const isWDSEnabled = useFeatureFlag("ab_wds_enabled");

  const marginHorizontalClass = props.enableMainCanvasResizer
    ? `mx-0`
    : `mx-auto`;
  const paddingBottomClass = props.enableMainCanvasResizer ? "" : "pb-52";
  try {
    return (
      <WDSThemeProvider theme={theme}>
        <Wrapper
          $enableMainCanvasResizer={!!props.enableMainCanvasResizer}
          $scale={scale}
          background={backgroundForCanvas}
          className={`relative t--canvas-artboard ${paddingBottomClass} transition-all duration-400  ${marginHorizontalClass} ${getViewportClassName(
            canvasWidth,
          )}`}
          data-testid={"t--canvas-artboard"}
          id={CANVAS_ART_BOARD}
          ref={isWDSEnabled ? undefined : focusRef}
          width={canvasWidth}
        >
          {props.widgetsStructure.widgetId &&
            renderAppsmithCanvas({
              ...props.widgetsStructure,
              classList:
                layoutSystemType === LayoutSystemTypes.ANVIL
                  ? ["main-anvil-canvas"]
                  : [],
            } as WidgetProps)}
        </Wrapper>
      </WDSThemeProvider>
    );
  } catch (error) {
    log.error("Error rendering DSL", error);
    Sentry.captureException(error);
    return null;
  }
};

export default Canvas;
