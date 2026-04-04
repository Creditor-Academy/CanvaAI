import { Extension } from '@tiptap/core';

export const TextDirection = Extension.create({
    name: 'customTextDirection',

    addOptions() {
        return {
            types: ['heading', 'paragraph'],
            directions: ['ltr', 'rtl', 'auto'],
            defaultDirection: null,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    dir: {
                        default: this.options.defaultDirection,
                        parseHTML: element => element.dir || null,
                        renderHTML: attributes => {
                            if (attributes.dir === this.options.defaultDirection) {
                                return null;
                            }
                            return { dir: attributes.dir };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setTextDirection: (direction) => ({ commands, tr }) => {
                if (!this.options.directions.includes(direction)) {
                    return false;
                }

                return commands.command(({ tr, state, dispatch }) => {
                    let changed = false;
                    const { selection } = state;
                    const { from, to } = selection;

                    state.doc.nodesBetween(from, to, (node, pos) => {
                        if (this.options.types.includes(node.type.name)) {
                            if (node.attrs.dir !== direction) {
                                if (dispatch) {
                                    tr.setNodeMarkup(pos, null, { ...node.attrs, dir: direction });
                                }
                                changed = true;
                            }
                        }
                    });

                    return changed;
                });
            },

            unsetTextDirection: () => ({ commands }) => {
                return commands.command(({ tr, state, dispatch }) => {
                    let changed = false;
                    const { selection } = state;
                    const { from, to } = selection;

                    state.doc.nodesBetween(from, to, (node, pos) => {
                        if (this.options.types.includes(node.type.name)) {
                            if (node.attrs.dir !== null) {
                                if (dispatch) {
                                    tr.setNodeMarkup(pos, null, { ...node.attrs, dir: null });
                                }
                                changed = true;
                            }
                        }
                    });

                    return changed;
                });
            },
        };
    },
});
