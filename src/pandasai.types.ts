/**
 * Standalone TypeScript data definitions translated from
 * pandas-ai/pandasai/data_loader/semantic_layer_schema.py.
 *
 * Preserves model names, serialized field names, optionality, and nullable values.
 * Python int/float map to number; Any maps to unknown; Relation.from_ uses its JSON alias `from`.
 * Optional fields default to null upstream unless another default is documented.
 * Defaults are documented, not applied. Pydantic validators, model methods, and YAML
 * serialization are runtime behavior and are not implemented by these type definitions.
 */

export interface SQLConnectionConfig {
  /** Host for the database server */
  host: string;
  /** Port for the database server */
  port: number;
  /** Target database name */
  database: string;
  /** Database username */
  user: string;
  /** Database password */
  password: string;
}

export interface Column {
  /** Name of the column. */
  name: string;
  /** Data type of the column. */
  type?: string | null;
  /** Description of the column */
  description?: string | null;
  /** Aggregation expression (avg, min, max, sum) */
  expression?: string | null;
  /** Alias for the column */
  alias?: string | null;
}

export interface Relation {
  /** Name of the relationship. */
  name?: string | null;
  /** Description of the relationship. */
  description?: string | null;
  /** Source column for the relationship. */
  from: string;
  /** Target column for the relationship. */
  to: string;
}

export interface TransformationParams {
  /** Column to transform */
  column?: string | null;
  /** Value for fill_na and other transformations */
  value?: string | number | boolean | null;
  /** Mapping dictionary for map_values transformation */
  mapping?: Record<string, string> | null;
  /** Format string for date formatting */
  format?: string | null;
  /** Number of decimal places for rounding */
  decimals?: number | null;
  /** Scaling factor */
  factor?: number | null;
  /** Target timezone or format */
  to_tz?: string | null;
  /** From timezone or format */
  from_tz?: string | null;
  /** Error handling mode for numeric/datetime conversion */
  errors?: string | null;
  /** Old value for replace transformation */
  old_value?: unknown;
  /** New value for replace transformation */
  new_value?: unknown;
  /** New name for column in rename transformation */
  new_name?: string | null;
  /** Pattern for extract transformation */
  pattern?: string | null;
  /** Length for truncate transformation */
  length?: number | null;
  /** Whether to add ellipsis in truncate */
  /** @default true */
  add_ellipsis?: boolean | null;
  /** Width for pad transformation */
  width?: number | null;
  /** Side for pad transformation */
  /** @default "left" */
  side?: string | null;
  /** Character for pad transformation */
  /** @default " " */
  pad_char?: string | null;
  /** Lower bound for clip */
  lower?: number | null;
  /** Upper bound for clip */
  upper?: number | null;
  /** Bins for binning */
  bins?: number | number[] | null;
  /** Labels for bins */
  labels?: string[] | null;
  /** Whether to drop first category in encoding */
  /** @default true */
  drop_first?: boolean | null;
  /** Whether to drop invalid values */
  /** @default false */
  drop_invalid?: boolean | null;
  /** Start date for date range validation */
  start_date?: string | null;
  /** End date for date range validation */
  end_date?: string | null;
  /** Country code for phone normalization */
  /** @default "+1" */
  country_code?: string | null;
  /** List of columns for multi-column operations */
  columns?: string[] | null;
  /** Which duplicates to keep */
  /** @default "first" */
  keep?: string | null;
  /** Reference DataFrame for foreign key validation */
  ref_table?: unknown;
  /** Reference column for foreign key validation */
  ref_column?: string | null;
  /** Whether to drop negative values */
  /** @default false */
  drop_negative?: boolean | null;
}

export interface Transformation {
  /** Type of transformation to be applied. */
  type: string;
  /** Parameters for the transformation. */
  params?: TransformationParams | null;
}

export interface Source {
  /** Type of the data source. */
  type: string;
  /** Path of the local data source. */
  path?: string | null;
  /** Connection object of the data source. */
  connection?: SQLConnectionConfig | null;
  /** Table of the data source. */
  table?: string | null;
}

export interface Destination {
  /** Type of the destination. */
  type: string;
  /** Format of the output file. */
  format: string;
  /** Path to save the output file. */
  path: string;
}

/**
 * Upstream validation requires source or a truthy view, but not both; unique column
 * names; a valid dataset name; valid group_by columns; and, for views, qualified
 * dataset.column references and relations covering the referenced datasets.
 */
export interface SemanticLayerSchema {
  /** Dataset name. */
  name: string;
  /** Data source for your dataset. */
  source?: Source | null;
  /** Whether table is a view */
  view?: boolean | null;
  /** Dataset’s contents and purpose description. */
  description?: string | null;
  /** Structure and metadata of your dataset’s columns */
  columns?: Column[] | null;
  /** Relationships between columns and tables. */
  relations?: Relation[] | null;
  /** Ordering criteria for the dataset. */
  order_by?: string[] | null;
  /** Maximum number of records to retrieve. */
  limit?: number | null;
  /** List of transformations to apply to the data. */
  transformations?: Transformation[] | null;
  /** Destination for saving the dataset. */
  destination?: Destination | null;
  /** Frequency of dataset updates. */
  update_frequency?: string | null;
  /** List of columns to group by. Every non-aggregated column must be included in group_by. */
  group_by?: string[] | null;
}
