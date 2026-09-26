export type NormalizePath<Path extends string> =
  Path extends "" ? "/" :
  Path extends `/${infer Rest}` ? NormalizePath<Rest> extends "/" ? "/" : `/${NormalizePath<Rest> extends `/${infer Out}` ? Out : never}` :
  Path extends `${infer Head}//${infer Tail}` ? NormalizePath<`${Head}/${Tail}`> :
  Path extends `${infer A}/` ? NormalizePath<A> :
  `/${Path}`;

export type JoinPath<Prefix extends string, Segment extends string> =
  Prefix extends "" | "/"
    ? NormalizePath<Segment>
    : Segment extends ""
      ? NormalizePath<Prefix>
      : NormalizePath<`${Prefix}/${Segment}`>;

export type ExtractParamNames<Path extends string> =
  Path extends `${infer Segment}/${infer Rest}`
    ? ExtractParamNames<Segment> | ExtractParamNames<Rest>
    : Path extends `:${infer Param}`
      ? Param extends `${infer Name}?` ? Name : Param
      : never;

export type ExtractRequiredParamNames<Path extends string> =
  Path extends `${infer Segment}/${infer Rest}`
    ? ExtractRequiredParamNames<Segment> | ExtractRequiredParamNames<Rest>
    : Path extends `:${infer Param}`
      ? Param extends `${string}?` ? never : Param
      : never;

export type ExtractOptionalParamNames<Path extends string> =
  Path extends `${infer Segment}/${infer Rest}`
    ? ExtractOptionalParamNames<Segment> | ExtractOptionalParamNames<Rest>
    : Path extends `:${infer Param}`
      ? Param extends `${infer Name}?` ? Name : never
      : never;

export type ParamsForPath<Path extends string> = (
  [ExtractRequiredParamNames<Path>] extends [never]
    ? {}
    : { [K in ExtractRequiredParamNames<Path>]: string }
) & (
  [ExtractOptionalParamNames<Path>] extends [never]
    ? {}
    : { [K in ExtractOptionalParamNames<Path>]?: string }
);

export type HasParams<Path extends string> = keyof ParamsForPath<Path> extends never ? false : true;
export type HasRequiredParams<Path extends string> = keyof Pick<
  ParamsForPath<Path>,
  ExtractRequiredParamNames<Path> & keyof ParamsForPath<Path>
> extends never ? false : true;
