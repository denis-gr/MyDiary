const _promice = (async () => {
    const l = navigator.language.slice(null, 2);
    await import("{{ start_url }}/static/ckeditor5/build/ckeditor.js");
    await import(`{{ start_url }}/static/ckeditor5/build/translations/${l}.js`);
})();

async function initEditor(el) {
    await _promice;
    const _ckeditor_settings = {
        toolbar: {
            items: [
                'undo',
                'redo',
                '|',
                'heading',
                '|',
                'bold',
                'italic',
                'strikethrough',
                'underline',
                'superscript',
                'subscript',
                'fontColor',
                'fontBackgroundColor',
                'alignment',
                'indent',
                'outdent',
                '|',
                'bulletedList',
                'numberedList',
                'todoList',
                'imageUpload',
                'link',
                'insertTable',
                'imageInsert',
                'blockQuote',
                'mediaEmbed',
                'horizontalLine',
                '|',
                'removeFormat'
            ]
        },
        language: window.navigator.language.slice(null, 2),
        image: {
            toolbar: [
                'imageTextAlternative'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells'
            ]
        },
    };
    return ClassicEditor.create(el, _ckeditor_settings);
};
