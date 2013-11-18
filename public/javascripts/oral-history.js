//var currentlyPlayingId; using _ui_state.history is enough?

//var iframe,player;

//var history = [];
//var step = 0;

var pendingSeektoTime = 0;

var playTime = 0;

var videoInfo = {};

var _ui_state = {
	stat_zoom : false,
	history : [],
	step : 0
}

//var VIMEO_PARAMS = '?title=0&portrait=0&byline=0&color=FFA200&api=1&player_id=player1';

var popcorn, video;

window.navigator.sayswho = (function() {
	var N = window.navigator.appName, ua = window.navigator.userAgent, tem;
	var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
	if (M && ( tem = ua.match(/version\/([\.\d]+)/i)) != null)
		M[2] = tem[1];
	M = M ? [M[1], M[2]] : [N, window.navigator.appVersion, '-?'];
	return M;
})();

// alert('saywho '+window.navigator.sayswho[0]);

$(document).ready(function() {

	console.log('test');

	$("#event-tabs").tabs({
		select : function(event, ui) {
			console.log("PRESSED TAB!");
		}
	});
	$('#event-type').val('comment');
/*
	$("#event-tabs").bind("tabsselect", function(event, ui) {
		console.log('tab change');
		var tab_list = ['comment', 'bookmark', 'transcript', 'link'];
		$('#event-type').val(tab_list[ui.index]);
	});
*/
	/*
	 * above functions dont work (?!?!) so replaced by this:
	 */
	
	$('.ui-tabs-anchor').click( function() {
		var tab_list = ['comment', 'bookmark', 'transcript', 'link'];
		$('#event-type').val(tab_list[this.id.match( /\d+/g)-1]);
		
	});
	
	//disabling category checkboxes (for now)
	$('.cat-checkbox').attr("disabled", true);


	console.log('doc/ready');
	$.getJSON('getAllVideoInfo?p1=1', function(data) {
		console.log('data');
		console.log(data);
		videoInfo = turnToKeydMap(data.videoInfo);

		console.log(videoInfo);

		//           video = Popcorn.HTMLVimeoVideoElement('#iframe-container');

		initializeVideoDialog(function() {

			$('#video_selection').slideToggle();

		});

	});
	// get json

	$('.stat-bar').progressbar({
		value : false,
		max : 100
	});

	$('.zoom').click(function() {

		if (_ui_state.stat_zoom) {
			$('.stat-bar').animate({
				'height' : '40px'
			});
			$('.stat-bar').css('width', '1000px');
			$('.stat-bar').draggable(false);
			$('.stat-bar').css('left', 0);

		} else {
			$('.stat-bar').animate({
				'height' : '100px'
			});
			$('.stat-bar').css('width', '5000px');
			$('.stat-bar').draggable({
				axis : 'x'
			});
			var leftMove = Math.round(((currentTime) * $('.stat-bar').width()) / videoInfo[_ui_state.history[_ui_state.step - 1]._id].length);
			if (leftMove > 500) {
				$('.stat-bar').animate({
					'left' : -(leftMove - 400)
				});
			}
		}

		setTimeout(function() {
			drawEvents()
		}, 200);
		_ui_state.stat_zoom = !_ui_state.stat_zoom;
	});

	$("#relevance-slider").slider({
		value : 100,
		min : 0,
		max : 100,
		step : 10,
		slide : function(event, ui) {
			console.log(ui.value);
			console.log($("#relevance-value"));

			$("#relevance-value").text(ui.value + '%');
		}
	});

	//  $("#add_video_form").ajaxForm({url: '/addVideo', type: 'post'})

	$("#add_video_form .login-submit").click(function() {

		console.log('button clicked');

		var url = "addVideo";

		var videoData = $("#add_video_form").serialize();
		console.log(videoData);

		$.ajax({
			type : "POST",
			url : url,
			data : videoData, // serializes the form's elements.
			success : function(data) {
				$('#add_video_form .success_message').slideDown(500);
				setTimeout(function() {
					$('#add_video_form .success_message').slideUp(500);
					$('#add_video').slideUp(function() {
						$('#add_video_form').find("input[type=text], textarea").val("");
					});

				}, 2000);
			}
		});

		return false;
		// avoid to execute the actual submit of the form.
	});

});
// ready

function initializeVideoDialog(callback) {

	$("#video_selection ul").empty();
	for (key in videoInfo) {
		// console.log(videoInfo[key]);
		//videoInfo[key]

		var videoItem = $('#video_selection_item_template').tmpl(videoInfo[key]);
		videoItem.appendTo("#video_selection ul");

		// also added to link select
		var cloned = videoItem.clone();

		cloned.find('a').removeAttr("onclick");
		cloned.find('a').click(function() {
			return false;
		});

		cloned.appendTo("#link-select");

	}

	$("#link-select").selectable({
		stop : function() {
			// var result = $( "#select-result" ).empty();
			$(".ui-selected", this).each(function() {
				var index = $("#link-select li").index(this);
				console.log(" #" + (index + 1 ));
			});
		}
	});
	callback();

}

function selectVideoDialog() {

	initializeVideoDialog(function() {

		$('#video_selection').slideToggle();

	});

}

function addVideoDialog() {

	$('#video_selection').slideUp(function() {

		$('#add_video').slideToggle();

	});

}

function selectVideo(id) {
	var initialVideo;
	// = videoInfo.first();

	//load video details here
	initialVideo = videoInfo[id];
	//videoInfo['517b00a50c98266a20000003'];

	console.log(initialVideo);

	_ui_state.history[_ui_state.step] = {
		'_ui_state.step' : _ui_state.step,
		'_id' : initialVideo['_id'],
		'title' : initialVideo.title,
		'url' : initialVideo.url
	};

	_ui_state.step++;

	switchToVideo(initialVideo.title, initialVideo.url, 0);

	if (_ui_state.step == 1) {
		$('#edit-controls').slideToggle();

	}

	$('#video_selection').slideToggle();

}

function pushEventsToPopcorn() {
	var currentId = _ui_state.history[_ui_state.step - 1]._id;
	var events = videoInfo[currentId].events;

	// var footnotes = [];
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		if (event.related_objects[0]._type == 'transcript') {
			popcorn.footnote({
				start : Math.round(event.timestamp),
				end : Math.round(event.timestamp + event.duration),
				text : event.related_objects[0].text,
				target : ".transcript-section"
			});
		}
	}
	// popcorn.footnote(footnotes);

}

function drawEvents() {

	// clean up
	$('.stat-bar .event').remove();

	var currentId = _ui_state.history[_ui_state.step - 1]._id;
	var events = videoInfo[currentId].events;

	videoInfo[currentId]['length'] = popcorn.duration();
	;

	console.log('duration ' + videoInfo[currentId]['length']);
	console.log('evnets ' + events.length);
	//setting events

	for (var i = 0; i < events.length; i++) {
		var event = events[i];

		//                    console.log(event);

		var video_lenght = popcorn.duration();
		//videoInfo[currentId).length;
		var left = Math.round((event.timestamp * $('.stat-bar').width()) / video_lenght);

		var event_width = Math.round((event.duration * $('.stat-bar').width()) / video_lenght);

		var id = 'event-' + event._id + '-' + i;
		var eventHtml = '<div id="' + id + '" class="event event-' + event.related_objects[0]._type + '" title="some title" ></div>';
		$('.stat-bar').append(eventHtml);

		$('#' + id).css('left', left);
		$('#' + id).css('width', event_width);

		$('#' + id).tooltip({
			content : function() {
				var element = $(this);

				var event_id = element[0].id.substring(6, 29);
				var event_index = element[0].id.substring(31);

				var vid_events = videoInfo[currentId].events;

				var tooltip = $('#event_tooltip_template').tmpl(vid_events[event_index]);
				// console.log(tooltip);

				return tooltip;

			}
		});
		/*
		if(event.type=='transcript') {
		popcorn.footnote({
		start: Math.round(event.timestamp),
		end: Math.round(event.timestamp+event.duration),
		text: event.related_objects[0].text,
		target: ".transcript-section"
		});
		}
		*/

		// $('#'+id).tooltip('open');

	}

}

function openSearchResults() {

	$.window({
		showModal : false,
		content : "<div></div>",
		title : 'Related videos to ...',
		x : 780,
		y : 105,
		width : 400,
		height : 500,
		scrollable : false,
		showFooter : false,
		maximizable : false,
		minimizable : false

	});
	return false;

}

// Call the API when a button is pressed

function onPause(id) {
	//  stat.text('paused');
}

function onFinish(id) {
	// stat.text('finished');
}

var previousTime = 0;
var currentTime = 0;
var INTERVAL = 1;
//seconds

function addRelatedVideoToHtmlList(relatedObject) {

	//console.log(relatedObject);
	$("#related_video_list_item_template").tmpl(relatedObject).appendTo(".ralated-video-list");
	//console.log($('.ralated-video-list').html());

}

function onSeek(timeInfo, id) {

	// not needed

	/*
	 console.log('on seek');

	 var currentId = _ui_state.history[_ui_state.step-1]._id;
	 var events = videoInfo[currentId].events;

	 console.log(timeInfo);
	 console.log(currentId);

	 var progress = timeInfo.percent*100;

	 $('.stat-bar').progressbar( "option", { value: progress });

	 processEvents(events,timeInfo.seconds, previousTime,false);

	 playTime = parseFloat(timeInfo.seconds);

	 */

}

function toMinAndSec(secs, decimal) {
	return Math.floor(parseFloat(secs) / 60) + 'm ' + ((parseFloat(secs) % 60).toFixed(decimal)) + 's';
}

function onPlayProgress(data, id) {

	$('.stat').text(toMinAndSec(popcorn.currentTime(), 1));
	currentTime = popcorn.currentTime();
	//console.log(data);

	playTime = parseFloat(popcorn.currentTime());

	var thisInterval = currentTime - previousTime;
	if (thisInterval > INTERVAL) {

		var progress = (popcorn.currentTime() / popcorn.duration()) * 100;

		$('.stat-bar').progressbar("option", {
			value : progress
		});

		var currentId = _ui_state.history[_ui_state.step - 1]._id;
		var events = videoInfo[currentId].events;

		//	for(var event in events) {

		processEvents(events, currentTime, previousTime, true);

		previousTime = currentTime;
	}
	//   		console.log(previousTime);

}

// need to be changed to popcorn

function processEvents(events, currentTime, previousTime, animate) {

	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		var timestamp = Math.round(event.timestamp);
		if (previousTime <= timestamp && timestamp < currentTime) {
			//console.log('processing event cur '+currentTime+' timestamp '+ event.timestamp+' prev '+previousTime);

			//$('.ralated-video-list').html('');  //empty list?

			for (var j = 0; j < event.related_objects.length; j++) {
				var rel_object = event.related_objects[j];

				console.log('j ' + j);
				console.log(rel_object);
				console.log(rel_object._id);
				console.log(rel_object._type);
				if (rel_object._type == 'link' || rel_object._type == 'video' /* for legacy, remove*/) {

					//console.log(rel_object.id);
					//var relatedVideo = getVideoByOldVideoId(rel_object.temp_rel_video);

					var relatedVideo = videoInfo[rel_object._related_video];
					// console.log(relatedVideo);

					var listId = 'video_' + relatedVideo._id;
					var listElement = $('.ralated-video-list #' + listId);

					var listWidth = $('.ralated-video-list').width();
					
					//link_relevance_value
					var link_relatedness = rel_object.link_relevance_value || rel_object.relatedness; //TODO second item for legacy! remove

					rel_object.width = link_relatedness * listWidth;
					rel_object.relatedness_percent = link_relatedness * 100;

					//  console.log(relatedVideo);
					rel_object.title = relatedVideo.title;

					rel_object.thumbnail = relatedVideo.thumbnail;
					rel_object.link_entry_point = rel_object.link_entry_point || rel_object.seek_point; //TODO for legacy

					if (listElement.length == 0) {
						console.log('rel_object');
						console.log(rel_object);
						rel_object.rel_video_id = relatedVideo._id;
						addRelatedVideoToHtmlList(rel_object);
					}

					if (link_relatedness == 0) {
						console.log('removing');
						//							setTimeout(function() {removeElement(listElement);} , 500);
						if (animate) {

							$('.ralated-video-list #' + listId + ' .rel_bar').animate({
								'opacity' : 0
							}, 1000, function() {

								var listItem = $(this).parents('.related_list_item');
								listItem.remove();
								//console.log(element);

							});
						} else {
							if (listItem != undefined) {
								listItem.remove();
							}

						}

					} else {

					}
					if (animate) {
						$('.ralated-video-list #' + listId + ' .rel_bar').animate({
							'width' : rel_object.width
						});
						$('.ralated-video-list #' + listId + ' .rel-rel').animate({
							'left' : rel_object.width - 12
						});
					} else {

						$('.ralated-video-list #' + listId + ' .rel_bar').css('width', rel_object.width);
						$('.ralated-video-list #' + listId + ' .rel-rel').css('left', rel_object.width - 12);

					}
					$('.ralated-video-list #' + listId + ' .rel-rel').text(rel_object.relatedness_percent + '%');

				} else if (rel_object._type == 'transcript') {
					//	    $('.transcript-section').text(rel_object.text);

				}

			}

		}
	}
}

function removeElement(element) {
	console.log(element);
	console.log('remove');
	element.remove();
	console.log(element);
}

function openVideo(id, seek_point) {

	console.log(id);
	var info = videoInfo[id];
	console.log(info);

	_ui_state.history[_ui_state.step - 1].last_time = currentTime;
	console.log(currentTime);
	console.log(_ui_state.history);
	_ui_state.history[_ui_state.step] = {
		'_ui_state.step' : _ui_state.step,
		'_id' : info._id,
		'title' : info.title,
		'url' : info.url
	};
	//console.log('-------_ui_state.history');
	//console.log(_ui_state.history);
	_ui_state.step++;

	//   $('.navigation a.prev').css('color','#000');
	//   $('.navigation a.prev').css('cursor','auto');
	$('.navigation a.prev').addClass('active');

	console.log(_ui_state.history);

	switchToVideo(info.title, info.url, seek_point);

	console.log('setting seek_point ' + seek_point);
	if (seek_point != 0) {
		pendingSeektoTime = seek_point;
	}
	/*
	 console.log('before timeout');

	 setTimeout(function() {
	 console.log('pending? '+pendingSeektoTime);
	 if(pendingSeektoTime!=0) {
	 console.log('seeking '+pendingSeektoTime);
	 popcorn.play();
	 popcorn.currentTime(pendingSeektoTime);
	 pendingSeektoTime = 0;
	 }
	 },5000);
	 */
	return false;

}

function switchToVideo(title, url, seek_point) {

	console.log('switch');

	console.log('url ' + url);

	console.log(video);
	console.log(( typeof video));
	console.log('vimeo ' + ( video instanceof Popcorn.HTMLVimeoVideoElement));
	console.log('youtube ' + ( video instanceof Popcorn.HTMLYouTubeVideoElement));
	//   console.log(popcorn);

	if (url.indexOf('youtube') > -1) {
		console.log('youtube');
		//if(!(video instanceof Popcorn.HTMLYouTubeVideoElement)) {
		if (video == undefined || video.currentSrc.indexOf('youtube') < 0) {

			$('#iframe-container iframe').remove()
			console.log('reset to tuib')
			video = Popcorn.HTMLYouTubeVideoElement('#iframe-container');
		}

	} else if (url.indexOf('vimeo') > -1) {
		//        	if(!(video instanceof Popcorn.HTMLVimeoVideoElement)) {
		if (video == undefined || video.currentSrc.indexOf('vimeo') < 0) {

			$('#iframe-container iframe').remove()
			console.log('reset to vimeo')
			video = Popcorn.HTMLVimeoVideoElement('#iframe-container');
		}

	} else {
		console.log('else');
		//	if(!(video instanceof Popcorn.HTMLMediaElement)) {

		$('#iframe-container iframe').remove()
		video = Popcorn.HTMLMediaElement('#iframe-container');
		//    }

	}

	video.src = url;
	popcorn = Popcorn(video);

	console.log('switch, setting events');

	//popcorn.off('loadedmetadata');

	popcorn.on('loadstart', function() {

		console.log('loadstart');

		console.log('pending? ' + pendingSeektoTime);
		if (pendingSeektoTime > 0) {
			popcorn.currentTime(pendingSeektoTime);
			popcorn.play();
			console.log('play?');
		}

		drawEvents();
		pushEventsToPopcorn();

	});

	popcorn.on('loadedmetadata', function() {

		console.log('loadedmetadata');
		drawEvents();
		//  pushEventsToPopcorn();

	});

	popcorn.on('timeupdate', function() {
		onPlayProgress();
	});

	popcorn.on('pause', function() {
		onPause();
	});

	popcorn.on('finish', function() {
		onFinish();
	});

	popcorn.on('seek', function() {
		onSeek();
	});

	$('#video_title').text(title);
	//drawEvents();

	//	},3000);

}

function prevVideo() {
	console.log(_ui_state.history);
	if (_ui_state.history.length > 1 && _ui_state.step > 1) {
		_ui_state.history[_ui_state.step - 1].last_time = currentTime;
		_ui_state.step--;

		console.log(_ui_state.history[_ui_state.step - 1]);

		pendingSeektoTime = _ui_state.history[_ui_state.step - 1].last_time;

		switchToVideo(_ui_state.history[_ui_state.step - 1].title, _ui_state.history[_ui_state.step - 1].url, 0);

		var events = videoInfo[_ui_state.history[_ui_state.step - 1]._id].events;

		processEvents(events, _ui_state.history[_ui_state.step - 1].last_time, 0, false);

		if (_ui_state.step == 1) {
			$('.navigation a.prev').removeClass('active');
		}
	}
	return false;

}

function nextVideo() {
	if (_ui_state.step > _ui_state.history.length) {

	}
	return false;

}

function forwardRewind(seconds) {

	//player.api('seekTo',playTime+seconds);
	popcorn.currentTime(popcorn.currentTime() + seconds);

}

function create_event() {

	$('.create-controls').slideToggle();
	$('.create-controls #start-time').val(playTime);

}

function captureTime(position) {

	$(position).val(playTime);
}

function turnToKeydMap(videos) {
	var obj = {};
	var len = videos.length;
	for (var i = 0; i < len; i++) {
		obj[videos[i]._id] = videos[i];
	}

	return obj;
}

/*
 function videoInfo[id) {
 // not optimal at all!!!!! todo
 //return findById(videoInfo,id);
 return videoInfo[id];

 }

 */

function saveEvent() {

	var text_content = $('#' + $('#event-type').val() + '-tab .tab-text').val();
	var eventData = {
		'vid_id' : _ui_state.history[_ui_state.step - 1]._id,
		'vid_title' : _ui_state.history[_ui_state.step - 1].title,
		'start-time' : $('#start-time').val(),
		'end-time' : $('#end-time').val(), //$('#text-comments').val(),
		'event-type' : $('#event-type').val(),
		'tags' : $('#tags').val(),
		'text' : text_content
	};
	

	switch(eventData['event-type']) {
		// not needed first line takes care of this
		/*
		case 'transcript':
			eventData['text'] = text_content;
			break;
		case 'comment':
			eventData['text'] = text_content;
			break;
		case 'bookmark':
			eventData['text'] = text_content;
			break;
		*/
		case 'link':
			eventData['link-entry-point'] = $('#entry-point').val();
			eventData['link-relevance-value'] = $('#relevance-value').text().replace('%','')/100;
			eventData['link-relevant-video']=$('#link-select .ui-selected').attr('id').replace('video_','');
			break;
	}

	validateEventData(eventData);
	
	console.log(eventData);
	
	 $.post("addcomment", eventData ,function(video) {
		 console.log('data saved');
	 	 console.log(video);
	 	 videoInfo[video._id].events= video.events;
	
		 drawEvents();
	 	//     postEventsToPopcorn();  or just add new event
	
	 	$('.create-controls').slideToggle();

	 });

	 

}

function validateEventData() {

}

