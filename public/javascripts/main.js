const blockLine = ['block', 'table-row', 'list-item', ]
const blockContainer = ['UL', 'BLOCKQUOTE', 'HR']
$(function(){
    const notes = $('.body-inner')
    notes.each(function(i){
        // let lineCount = 1;
        $(this).find('*').each(function(i, el){
            if(blockLine.includes($(this).css('display')) && !blockContainer.includes(el.tagName)) {
                $(this).addClass('text-line')
            }
        })
    })
})