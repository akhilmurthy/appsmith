import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { updateAndSaveLayout, type WidgetAddChild } from "actions/pageActions";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import { getWidgets } from "sagas/selectors";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";
import { addWidgetsToPreset } from "../utils/layouts/update/additionUtils";
import { moveWidgets } from "../utils/layouts/update/moveUtils";

function* addWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    newWidget: WidgetAddChild;
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, newWidget } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    // Execute Blueprint operation to update widget props before creation.
    const newParams: { [key: string]: any } = yield call(
      executeWidgetBlueprintBeforeOperations,
      BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
      {
        parentId: highlight.canvasId,
        widgetId: newWidget.newWidgetId,
        widgets: allWidgets,
        widgetType: newWidget.type,
      },
    );
    const updatedParams: WidgetAddChild = { ...newWidget, ...newParams };

    // Create and add widget.
    const updatedWidgetsOnAddition: CanvasWidgetsReduxState = yield call(
      getUpdateDslAfterCreatingChild,
      {
        ...updatedParams,
        widgetId: highlight.canvasId,
      },
    );

    const canvasWidget = updatedWidgetsOnAddition[highlight.canvasId];

    /**
     * Add new widget to the children of parent canvas.
     * Also add it to parent canvas' layout.
     */
    const updatedWidgets = {
      ...updatedWidgetsOnAddition,
      [canvasWidget.widgetId]: {
        ...canvasWidget,
        children: [...(canvasWidget.children || []), newWidget.widgetId],
        layout: addWidgetsToPreset([canvasWidget.layout], highlight, [
          newWidget.widgetId,
        ]),
      },
    };
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("Anvil : add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        error,
      },
    });
  }
}
/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
function* moveWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    movedWidgets: string[];
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, movedWidgets } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const updatedWidgets: CanvasWidgetsReduxState = moveWidgets(
      allWidgets,
      movedWidgets,
      highlight,
    );
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(ReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(ReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
  ]);
}