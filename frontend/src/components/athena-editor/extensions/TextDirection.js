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
            setTextDirection: (direction) => ({ commands }) => {
                if (!this.options.directions.includes(direction)) {
                    return false;
                }

                return this.options.types.every(type =>
                    commands.updateAttributes(type, { dir: direction })
                );
            },

            unsetTextDirection: () => ({ commands }) => {
                return this.options.types.every(type =>
                    commands.resetAttributes(type, 'dir')
                );
            },
        };
    },
});
