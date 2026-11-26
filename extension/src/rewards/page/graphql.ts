type Value = string | { variable: string };
type Selection = true | Spec | { args: Record<string, Value>; select: Spec };
type Spec = { [field: string]: Selection };

type Name = { kind: "Name"; value: string };
type ValueNode =
  | { kind: "StringValue"; value: string }
  | { kind: "Variable"; name: Name };
type Argument = { kind: "Argument"; name: Name; value: ValueNode };
type Field = {
  kind: "Field";
  name: Name;
  arguments: Argument[];
  directives: [];
  selectionSet?: SelectionSet;
};
type SelectionSet = { kind: "SelectionSet"; selections: Field[] };

const name = (value: string): Name => ({ kind: "Name", value });

const hasArgs = (
  selection: Selection,
): selection is { args: Record<string, Value>; select: Spec } =>
  selection !== true && "args" in selection && "select" in selection;

function valueNode(value: Value): ValueNode {
  return typeof value === "string"
    ? { kind: "StringValue", value }
    : { kind: "Variable", name: name(value.variable) };
}

function selectionSet(spec: Spec): SelectionSet {
  return {
    kind: "SelectionSet",
    selections: Object.entries(spec).map(([key, selection]) => {
      const args = hasArgs(selection) ? selection.args : {};
      const sub = hasArgs(selection) ? selection.select : selection;
      return {
        kind: "Field",
        name: name(key),
        arguments: Object.entries(args).map(([argName, value]) => ({
          kind: "Argument",
          name: name(argName),
          value: valueNode(value),
        })),
        directives: [],
        ...(sub === true ? {} : { selectionSet: selectionSet(sub) }),
      };
    }),
  };
}

function printValue(value: Value): string {
  return typeof value === "string"
    ? JSON.stringify(value)
    : `$${value.variable}`;
}

function printSpec(spec: Spec): string {
  const fields = Object.entries(spec).map(([key, selection]) => {
    const args = hasArgs(selection) ? selection.args : {};
    const sub = hasArgs(selection) ? selection.select : selection;
    const printedArgs = Object.entries(args)
      .map(([argName, value]) => `${argName}: ${printValue(value)}`)
      .join(", ");
    const head = printedArgs ? `${key}(${printedArgs})` : key;
    return sub === true ? head : `${head} ${printSpec(sub)}`;
  });
  return `{ ${fields.join(" ")} }`;
}

function operation(
  type: "query" | "mutation",
  operationName: string,
  spec: Spec,
  inputType?: string,
): object {
  const variables = inputType ? `($input: ${inputType}!)` : "";
  const body = `${type} ${operationName}${variables} ${printSpec(spec)}`;
  return {
    kind: "Document",
    definitions: [
      {
        kind: "OperationDefinition",
        operation: type,
        name: name(operationName),
        variableDefinitions: inputType
          ? [
              {
                kind: "VariableDefinition",
                variable: valueNode({ variable: "input" }),
                type: {
                  kind: "NonNullType",
                  type: { kind: "NamedType", name: name(inputType) },
                },
                directives: [],
              },
            ]
          : [],
        directives: [],
        selectionSet: selectionSet(spec),
      },
    ],
    loc: {
      start: 0,
      end: body.length,
      source: {
        body,
        name: "GraphQL request",
        locationOffset: { line: 1, column: 1 },
      },
    },
  };
}

export const query = (operationName: string, spec: Spec) =>
  operation("query", operationName, spec);

export const mutation = (
  operationName: string,
  inputType: string,
  spec: Spec,
) => {
  const [[root, select] = []] = Object.entries(spec);
  if (!root || !select || select === true || hasArgs(select)) {
    throw new Error(`mutation ${operationName} needs one root field`);
  }
  return operation(
    "mutation",
    operationName,
    { [root]: { args: { input: { variable: "input" } }, select } },
    inputType,
  );
};
