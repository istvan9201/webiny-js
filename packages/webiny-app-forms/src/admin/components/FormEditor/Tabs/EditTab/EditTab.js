import React, { useCallback, useState } from "react";
import { Icon } from "webiny-ui/Icon";
import { get, cloneDeep } from "lodash";
import { Center, Vertical, Horizontal } from "../../DropZone";
import Draggable from "../../Draggable";
import EditFieldDialog from "./EditFieldDialog";
import Field from "./Field";
import { ReactComponent as HandleIcon } from "../../icons/round-drag_indicator-24px.svg";
import { rowHandle, EditContainer, fieldHandle, fieldContainer, Row, RowContainer } from "./Styled";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { getPlugins } from "webiny-plugins";
import type { FieldLayoutPositionType } from "webiny-app-forms/types";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.EditTab");

export const EditTab = () => {
    const {
        getFields,
        insertField,
        updateField,
        deleteField,
        data,
        moveField,
        moveRow
    } = useFormEditor();
    const [editingField, setEditingField] = useState(null);
    const [dropTarget, setDropTarget]: [FieldLayoutPositionType, Function] = useState(null);

    const editField = useCallback(field => {
        setEditingField(cloneDeep(field));
    });

    const handleDropField = useCallback((source, dropTarget) => {
        const { pos, type, ui } = source;

        if (type === "custom") {
            editField({});
            setDropTarget(dropTarget);
            return;
        }

        if (ui === "row") {
            // Reorder rows.
            // Reorder logic is different depending on the source and target position.
            return moveRow(pos.row, dropTarget.row);
        }

        // If source pos is set, we are moving an existing field.
        if (pos) {
            const fieldId = data.layout[pos.row][pos.index];
            return moveField({ field: fieldId, position: dropTarget });
        }

        // Find field plugin which handles the dropped field type "id".
        const plugin = getPlugins("form-editor-field-type").find(pl => pl.fieldType.id === type);
        insertField(plugin.fieldType.createField(), dropTarget);
    });

    const fields = getFields(true);

    return (
        <EditContainer>
            {fields.length === 0 && (
                <Center onDrop={item => handleDropField(item, { row: 0, index: 0 })}>
                    {t`Drop your first field here`}
                </Center>
            )}

            {fields.map((row, index) => (
                <Draggable beginDrag={{ ui: "row", pos: { row: index } }} key={index}>
                    {(
                        {
                            connectDragSource,
                            isDragging
                        } /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                    ) => (
                        <RowContainer style={{ opacity: isDragging ? 0.3 : 1 }}>
                            {connectDragSource(
                                <div className={rowHandle}>
                                    <Icon icon={<HandleIcon />} />
                                </div>
                            )}
                            <Horizontal
                                onDrop={item => handleDropField(item, { row: index, index: null })}
                            />
                            {/* Row start - includes field drop zones and fields */}
                            <Row>
                                {row.map((field, fieldIndex) => (
                                    <Draggable
                                        key={fieldIndex}
                                        beginDrag={{
                                            ui: "field",
                                            type: field.type,
                                            pos: {
                                                row: index,
                                                index: fieldIndex
                                            }
                                        }}
                                    >
                                        {({ connectDragSource }) =>
                                            connectDragSource(
                                                <div className={fieldContainer}>
                                                    <Vertical
                                                        onDrop={item =>
                                                            handleDropField(item, {
                                                                row: index,
                                                                index: fieldIndex
                                                            })
                                                        }
                                                        isVisible={item =>
                                                            item.ui === "field" &&
                                                            (row.length < 4 ||
                                                                get(item, "pos.row") === index)
                                                        }
                                                    />

                                                    <div className={fieldHandle}>
                                                        <Field
                                                            field={field}
                                                            onEdit={editField}
                                                            onDelete={deleteField}
                                                        />
                                                    </div>

                                                    {/* Field end */}
                                                    {fieldIndex === row.length - 1 && (
                                                        <Vertical
                                                            last
                                                            isVisible={item =>
                                                                item.ui === "field" &&
                                                                (row.length < 4 ||
                                                                    get(item, "pos.row") === index)
                                                            }
                                                            onDrop={item =>
                                                                handleDropField(item, {
                                                                    row: index,
                                                                    index: fieldIndex + 1
                                                                })
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )
                                        }
                                    </Draggable>
                                ))}
                            </Row>
                            {/* Row end */}
                            {index === fields.length - 1 && (
                                <Horizontal
                                    last
                                    onDrop={item =>
                                        handleDropField(item, {
                                            row: index + 1,
                                            index: null
                                        })
                                    }
                                />
                            )}
                        </RowContainer>
                    )}
                </Draggable>
            ))}

            <EditFieldDialog
                field={editingField}
                onClose={editField}
                onSubmit={data => {
                    if (data.id) {
                        updateField(data);
                    } else {
                        insertField(data, dropTarget);
                    }
                    editField(null);
                }}
            />
        </EditContainer>
    );
};