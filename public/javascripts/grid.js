function GridElement(index, window) {
    this.index = index;
	this.window = window;
	
	this.mode = 'search';
	
	this.window.getContainer().find('.grid_index').val(index);

}

GridElement.prototype.getX = function() {
	return this.window.getContainer().css('top');
}

GridElement.prototype.getY = function() {
	return this.window.getContainer().css('left');

}

GridElement.prototype.getResultContainer = function () { 
	return this.window.getContainer().find('.result_container');
}

GridElement.prototype.getSearchBox = function () { 
	return this.window.getContainer().find('.search_box');
}

GridElement.prototype.getNoteBox = function () { 
	return this.window.getContainer().find('.note_box');
}

GridElement.prototype.getTextContent = function () { 
	return this.window.getContainer().find('.results_box p').text();
}

GridElement.prototype.changeMode = function (mode) { 
	if(mode==this.mode)
		return;
	switch(mode) {
	case 'search':
		
	break;
	case 'note' :
	    var container = this.window.getContainer();
		container.find('.search_box').remove();
		container.find('.results_box').remove();
		$('<textarea/>').addClass('note_box').insertAfter(container.find('.checkboxes'));
		container.find('.change_to_note').css('display','none');
		container.find('.change_to_wiki').css('display','none');

	break;
	
	}
	this.mode = mode;
}