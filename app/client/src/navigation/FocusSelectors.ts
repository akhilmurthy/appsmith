import { matchPath } from "react-router";
import {
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "../constants/routes";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
} from "../pages/Editor/SaaSEditor/constants";
import { PluginType } from "../entities/Action";
import { EditorEntityTab } from "../entities/IDE/constants";

export const getSelectedDatasourceId = (path: string): string | undefined => {
  const match = matchPath<{ datasourceId?: string }>(path, [
    BUILDER_PATH_DEPRECATED + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_PATH + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + DATA_SOURCES_EDITOR_ID_PATH,
    BUILDER_PATH_DEPRECATED + SAAS_GSHEET_EDITOR_ID_PATH,
    BUILDER_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + SAAS_GSHEET_EDITOR_ID_PATH,
  ]);
  if (!match) return undefined;
  return match.params.datasourceId;
};

export type QueryListState =
  | { id: string; type: PluginType; pluginPackageName?: string }
  | undefined;

export const getSelectedQueryId = (path: string): QueryListState => {
  const match = matchPath<{
    queryId?: string;
    apiId?: string;
    pluginPackageName?: string;
  }>(path, [
    // CURL
    BUILDER_PATH_DEPRECATED + CURL_IMPORT_PAGE_PATH,
    BUILDER_PATH + CURL_IMPORT_PAGE_PATH,
    BUILDER_CUSTOM_PATH + CURL_IMPORT_PAGE_PATH,
    // Queries
    BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
    BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_ADD_PATH,
    // SASS
    BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
    BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
    BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
    BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_ADD_PATH,
    // API
    BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
    BUILDER_PATH + API_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + API_EDITOR_ID_ADD_PATH,
  ]);
  if (!match) return undefined;
  const { apiId, pluginPackageName, queryId } = match.params;
  let id = apiId ? apiId : queryId;
  if (!id && match.url.endsWith(CURL_IMPORT_PAGE_PATH)) {
    id = "curl";
  }
  if (!id) return undefined;
  let type: PluginType = PluginType.API;
  if (pluginPackageName) {
    type = PluginType.SAAS;
  } else if (queryId) {
    type = PluginType.DB;
  } else if (id === "curl") {
    type = PluginType.API;
  }
  return {
    type,
    id,
    pluginPackageName,
  };
};

export const getSelectedJSObjectId = (path: string): string | undefined => {
  const match = matchPath<{ collectionId?: string }>(path, [
    BUILDER_PATH_DEPRECATED + JS_COLLECTION_ID_PATH,
    BUILDER_PATH + JS_COLLECTION_ID_PATH,
    BUILDER_CUSTOM_PATH + JS_COLLECTION_ID_PATH,
  ]);
  if (!match) return undefined;
  return match.params.collectionId;
};

export const getSelectedSegment = (path: string): string | undefined => {
  const match = matchPath<{ entity: string }>(path, {
    path: [
      BUILDER_PATH_DEPRECATED + "/:entity",
      BUILDER_PATH + "/:entity",
      BUILDER_CUSTOM_PATH + "/:entity",
    ],
    exact: false,
  });
  if (!match) return undefined;
  if (match.params.entity === "jsObjects") {
    return EditorEntityTab.JS;
  }
  if (
    match.params.entity === "queries" ||
    match.params.entity === "api" ||
    match.params.entity === "saas"
  ) {
    return EditorEntityTab.QUERIES;
  }
  return EditorEntityTab.UI;
};
