// ----------------------------------------------------------
// Date stuff:
Date.prototype.today = function () {  // today's date;
	return (((this.getMonth()+1) < 10) ? '0':'') + (this.getMonth()+1) +'/'+ ( (this.getDate() < 10) ? '0':'') + this.getDate() +'/'+ this.getFullYear();
};
Date.prototype.timeNow = function () {  // current time
	return ((this.getHours() < 10) ? '0':'') + this.getHours() +':'+ ((this.getMinutes() < 10) ? '0':'') + this.getMinutes();
};
var today = new Date();
var date = today.today();

(function() {

	
	// --------------------
	// Memory Model
	var Memory_Model = Backbone.Model.extend({
		defaults: {
			'date': date,
			'memory_text': '',
			'media': {
				'image': '',
				'video':'',
				'audio':''
			},
			'emotions': {
				'joy': 0,
				'sadness': 0,
				'anger': 0,
				'fear': 0,
				'disgust': 0,
				'neutral': 0
			},
			'gradient': {
				'default': '',
				'webkit': '',
				'moz': ''
			}
		}
	});



	// --------------------
	// Memories Collection (rename to hippocampus?)
	var Memory_Collection = Backbone.Collection.extend({
		model: Memory_Model,
		localStorage: new Backbone.LocalStorage('Memory_LocalStorage')
	});
	var my_memory = new Memory_Collection();
	my_memory.fetch();




	// ---------------------
	// View for Control Panel
	var Control_Panel = Backbone.View.extend({
		el: $('#control_panel'),
		events: {
			'click #add_memory': 'add_memory'
		},
		initialize: function() {
			this.render();
		},
		render: function() {
		},

		add_memory: function() {
			memory_add_modal.render();
		}
	});
	var control_panel = new Control_Panel();




	// -------------------------
	// View for Add Memory Modal
	var Memory_Add_Modal = Backbone.View.extend({
		el: $('#add_memory_dialog'),
		events: {
			'click #modal_cancel'          : 'close',
			'click .modal_close'           : 'close',
			'click .input_attachment_icon' : 'toggle_attachment',
			'click #save_new_memory'       : 'save_memory',
			'click #add_audio_attachment'  : 'add_audio_attachment',
			'click #add_image_attachment'  : 'add_image_attachment',
			'click #add_video_attachment'  : 'add_video_attachment',			
			'keyup #input_memory'          : function() { 
												this.validate();
												this.new_memory.attributes.memory_text = $('#input_memory').val();
											}
		},
		initialize: function() {
			var view = this;

			view.initialize_new_memory();

			autosize($('#input_memory'));

			$('.emotion_slider').slider({
				//orientation: 'vertical',
				change: function(e, ui) {
					view.validate(e, ui);

					var el_id = $(e.target).attr('id');
					var prop = el_id.substring(el_id.indexOf('_') + 1, el_id.length);
					view.new_memory.attributes.emotions[prop] = ui.value;
				},
				range: 'min',
				value: 0,
				min: 0,
				max: 5,
			});
		},
		render: function() {
			this.$el.addClass('view');
			$('.input_attachment_icon').removeClass('active');
			$('#input_memory').focus();
		},
		render_model_data: function() {

			var memory = this.new_memory.attributes;

			// attachments:
			for (attachment in memory.media) {
				this.render_attachment_status(attachment, memory.media[attachment])
			}
		},
		render_attachment_status: function(attachment_type, attachment_value) {
			switch (attachment_type) {
				case 'audio':
					var $attch_icon = $('#attachment_button_audio > .attachment_check');
					attachment_value ? $attch_icon.removeClass('hide') : $attch_icon.addClass('hide');
					break;
				case 'image':
					var $attch_icon = $('#attachment_button_image > .attachment_check');
					attachment_value ? $attch_icon.removeClass('hide') : $attch_icon.addClass('hide');
					break;
				case 'video':
					var $attch_icon = $('#attachment_button_video > .attachment_check');
					attachment_value ? $attch_icon.removeClass('hide') : $attch_icon.addClass('hide');
					break;
			}
		},
		values: {
		},
		clear: function() {
			$('#input_memory').val('');
			$('.emotion_slider').slider('value', 0);
		},
		close: function() {
			this.$el.removeClass('view');
		},

		toggle_attachment: function(e) {
			var $icon = $(e.target).closest('.input_attachment_icon'),
				attachment_type = $icon.attr('data-attachment-type');
			
			$icon.toggleClass('active').siblings().removeClass('active');

			if ($icon.hasClass('active')) {
				this.toggle_attachment_input(attachment_type);
			} else {
				this.toggle_attachment_input(false);
			}
		},
		validate: function(slide_event, slide_ui) {
			var view = this;

			// check for text input upon memory save
			if (! $('#input_memory').val() ) {
				//display_noty('warning', 'topCenter', 'Please enter a memory');
				view.handle_save_button('disable')
				return;
			}

			// check for emotion slider value(s) upon memory save
			var sliders_valid = false;
			this.$el.find('.emotion_slider').each(function(i, el) {
				if ( $(this).slider('value') > 0 ) {
					sliders_valid = true;
					return;
				}
			}).promise().done(function() {
				if (!sliders_valid) {
					//display_noty('warning', 'topCenter', 'Please enter an emotion value(s)');
					view.handle_save_button('disable');
					return;
				} else {
					view.handle_save_button('enable');
				}
			});

		},
		handle_save_button: function(action) {
			if (action === 'enable') {
				$('#save_new_memory').addClass('enabled');
			}
			else if (action === 'disable') {
				$('#save_new_memory').removeClass('enabled');
			}
		},
		toggle_attachment_input: function(type) {
			var $input_div = $('.attachments_input');
			if (type) {
				switch (type) {
					case 'audio':
						$input_div.html('<input id="audio_text_input" data-attachment-type="audio" type="text" placeholder="enter audio url here"><button id="add_audio_attachment">update</button>');
						$('#audio_text_input').val(this.new_memory.attributes.media.audio);
						break;
					case 'image':
						$input_div.html('<input id="image_text_input" data-attachment-type="image" type="text" placeholder="enter image url here"><button id="add_image_attachment">update</button>');
						break;
					case 'video':
						$input_div.html('<input id="video_text_input" data-attachment-type="video" type="text" placeholder="enter video url here"><button id="add_video_attachment">update</button>');
						break;
					default:
						console.log('error - toggle_attachment_input');
						break;												
				}
			} else 
				$input_div.html('');
		},
		add_audio_attachment: function() {
			var $input_val = $('#audio_text_input').val();
			this.new_memory.attributes.media.audio = $input_val;
			this.render_model_data();
		},
		add_image_attachment: function() {
			var $input_val = $('#image_text_input').val();
			this.new_memory.attributes.media.image = $input_val;
			this.render_model_data();
		},
		add_video_attachment: function() {
			var $input_val = $('#video_text_input').val();
			this.new_memory.attributes.media.video = $input_val;
			this.render_model_data();
		},
		validate_url: function(url) {
			return url.match(/^HTTP|HTTP|http(s)?:\/\/(www\.)?[A-Za-z0-9]+([\-\.]{1}[A-Za-z0-9]+)*\.[A-Za-z]{2,40}(:[0-9]{1,40})?(\/.*)?$/);		
		},		
		initialize_new_memory: function() {
			this.new_memory = new Memory_Model({
				'date': date,
				'memory_text': '',
				'media': {
					'image': '',
					'video':'',
					'audio':''
				},
				'emotions': {
					'joy': '',
					'sadness': '',
					'anger': '',
					'fear': '',
					'disgust': '',
					'neutral': ''
				},
				'gradient': {
					'default': '',
					'webkit': '',
					'moz': ''
				}
			});
		},
		update_new_memory: function(obj_prop, value) {
			this.new_memory[obj_prop] = value;
		},			
		save_memory: function() {

			// access model data via: new_memory.attributes.(properties here)
			// convert slider input values to a linear gradient string
			var gradient_str = emotions_to_gradient(this.new_memory);
			this.new_memory.attributes.gradient.default = gradient_str;

			my_memory.add(this.new_memory);
			this.new_memory.save();
	
			this.close();	
			this.clear();		
		}
	});
	var memory_add_modal = new Memory_Add_Modal();





	// ---------------------
	// View for Memory Display
	var Memory_Display = Backbone.View.extend({
		el: $('#memory_display'),
		events: {
			'click #memory-display-close': 'close_display',
			'click .memory-display-delete': 'delete_memory' 
		},
		initialize: function() {
		},
		render: function(model) {
			this.current_memory = model;
			this.$el.animate({
				top: '96px'
			}, 850, 'easeOutQuart');
			this.$el.find('.memory-display-date').text(model.attributes.date);
			this.$el.find('.memory-display-text').text(model.attributes.memory_text);
		},
		current_memory: '',
		close_display: function() {
			this.$el.animate({
				top: '-260px'
			}, 850, 'easeOutQuart', function() {
				$('.memory-active').removeClass('memory-active');
			});
		},
		delete_memory: function() {
			this.current_memory.destroy();

			this.close_display();
			//memories.render();
		}
	});
	var memory_display_view = new Memory_Display();
	




	// --------------------------
	// View for individual memory
	var Memory_View = Backbone.View.extend({
		tagName: 'div',
		className: 'memory',
		events: {
			'click': 'view_memory',
		},
		template: _.template($('#memory_template').html()),
		initialize: function() {
			this.render();
		},
		render: function() {
			this.$el.html(this.template(this.model));
			//this.$el.css({'background': this.model.attributes.gradient.default.toString() });
			this.$el.attr('style', 'background: ' + this.model.attributes.gradient.default.toString());

			return this;
		},
		remove_memory: function() {
			this.model.destroy();	// delete model
			this.remove();			// delete view
		},
		// Custom Events
		view_memory: function() {
			if (this.$el.hasClass('memory-active')) {
				memory_display_view.close_display();
			} else {
				$('.memory-active').removeClass('memory-active')
				this.$el.addClass('memory-active');
				memory_display_view.render(this.model);				
			}
		},
		/*
		add_gradient: function($el) {
			var m = this.model.attributes;
			$(this).css({
				'background-color': m.gradient,
				'background-color': m.webkit_gradient
			});
		}
		*/
	}); 





	var $memory_display = $('#memory_display');
	// --------------------------
	// View for Memory Collection
	var Memories_View = Backbone.View.extend({
		el: $('#memory_container'),
		events: {
		},
		initialize: function() {
			this.collection = my_memory;
			this.collection.toJSON();
			this.render();
			this.collection.on('add', this.render_item, this);
			this.collection.on('remove', this.remove_item, this);
		},
		render: function() {
			this.$el.html('');
			var that = this;
			_.each(this.collection.models, function(model) {
				that.render_item(model);
			}, this);
		},
		render_item: function(model) {
			if (model) {
				var model_view = new Memory_View({ model: model });
				this.$el.append(model_view.render().el);
			}
		},
		remove_item: function() {
			this.render();
		},
		delete_collection: function() {
			this.collection.each(function(model) {
				model.destroy();
			});
			this.render();
		},
		sort_by_emotion: function(emotion) {
		},
		sort_by_date: function() {
		}

	});
	var memories = new Memories_View();






	/* --------------------------------------------------------------------------- */
	/* Extra Functions */

	function emotions_to_gradient(memory_model) {

		var emotions = {},
			m = memory_model.attributes.emotions;

		if (m.joy)
			emotions['joy'] = m.joy;
		if (m.sadness)
			emotions['sadness'] = m.sadness;
		if (m.anger)
			emotions['anger'] = m.anger;
		if (m.fear)
			emotions['fear'] = m.fear;
		if (m.disgust)
			emotions['disgust'] = m.disgust;
		if (m.neutral)
			emotions['neutral'] = m.neutral;


		// only one emotion value, no gradient
		if (Object.keys(emotions).length == 1) return get_emotion_color(Object.keys(emotions)[0]);


		// convert emotion slider value to it's percentage
		var emotions_percent_obj = _.mapObject(emotions, function(val, key) {
			return Math.floor( (val/sum_obj_values(emotions)) * 100 );
		});


		// build css linear gradient string
		var current_percentage = 0,
			i = 0,
			obj_len = Object.keys(emotions_percent_obj).length,
			value,
			gradient_str = 'linear-gradient(to bottom, ';


		for (emotion in emotions_percent_obj) {
			if (i === (obj_len - 1))
				value = ');'; // last object property / emotion; end gradient_str
			else {
				current_percentage += emotions_percent_obj[emotion];
				value = current_percentage + '%, ';
			}
			gradient_str += get_emotion_color(emotion) + ' ' + value;
			i++;
		}
		return gradient_str;
	}


	// Sum all values (that are numbers) in an object
	function sum_obj_values(obj) {
		var sum = 0;
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop))
				sum += obj[prop];
		}
		return sum;
	}

	function get_emotion_color(emotion_str) {
		switch (emotion_str) {
			case 'joy':
				return '#F5F317';
				break;
			case 'sadness':
				return '#5380be';
				break;
			case 'anger':
				return '#db373e';
				break;
			case 'fear':
				return '#c3648e';
				break;
			case 'disgust':
				return '#73c557';
				break;
			case 'neutral':
				return '#ddd';
				break;																		
		}
	}


	/* Utility Functions */
	function display_noty(type, location, msg) {
		var n = noty({
			type: type,
			layout: location,
			text: msg,
			timeout: 2000,
			modal: false,
			maxVisible: 5,
			closeWith: ['click']
		});
	}
	/*
		types: alert, success, error, warning, information, confirm
		layouts: top, topLeft, topCenter, topRight, centerLeft, center, centerRight, bottomLeft, bottomCenter, bottomRight, bottom
	*/


})();