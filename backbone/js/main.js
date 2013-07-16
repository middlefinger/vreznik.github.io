function initPage(){
	var personModel = Backbone.Model.extend({
		defaults:{
			name: 'Enter name...',
			email: 'Enter email...',
			phone: 'Enter phone...',
			image: 'images/default.jpg'
		},
		clear: function(){
			this.destroy();
		},
		validateImage: function(){
			if(this.get('image') == '') this.set('image', this.defaults.image)
			return this;
		},
		initialize: function(){
			this.validateImage();
		}
	});

	var personCollection = Backbone.Collection.extend({
		url: '/users',
		model: personModel
	});

	var people = new personCollection;
	
	var personView = Backbone.View.extend({
		className: 'person',
		template: _.template(jQuery('#tmpl-list').html()),
		events:{
			'click .refresh': 'refresh',
			'click .edit': 'edit',
			'click .delete': 'del'
		},
		initialize: function(){
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
		},
		render: function(){
			this.$el.empty().append(this.template(this.model.toJSON()));
			return this;
		},
		refresh: function(e){
			this.model.fetch();
			e.preventDefault();
		},
		edit: function(e){
			new modalView({model: this.model});
			e.preventDefault();
		},
		del: function(e){
			this.model.clear();
			e.preventDefault();
		}
	});
	
	var modalView = Backbone.View.extend({
		id: 'lightbox',
		className: 'popup',
		overlay: jQuery('<div id="overlay" />'),
		template: _.template(jQuery('#tmpl-add').html()),
		events: {
			'click .upload': 'upload',
			'click .save': 'save',
			'click .close': 'close'
		},
		initialize: function(){
			this.render();
		},
		render: function(){
			var lightbox = this.$el.append(this.template(this.model.toJSON()));
			jQuery('body').append(this.overlay.css({opacity:.5}));
			jQuery('body').append(lightbox);
			lightbox.css({
				left: (jQuery(window).width() - lightbox.width())/2 
			});
			return this;
		},
		upload: function(e){
			var that = this;
			var form = this.$el.find('form');
			form.find('input:file').trigger('click').change(function(){
				
				var file = this.files[0];
				var type = file.type;
					
				if(file.type == 'image/jpeg'){
					var formData = new FormData(form[0]);
					$.ajax({
						url: '/upload',
						type: 'POST',
						success: function(msg){
							form.find('img').attr('src', 'images/' + msg.toString());
						},
						error: function(){
							alert('Upload error !');
						},
						data: formData,
						cache: false,
						contentType: false,
						processData: false
					});
				}
			});
			e.preventDefault();
		},
		save: function(e){
			var form = jQuery('#lightbox form');
			var formInputs = form.find('input');

			if(this.model.collection){
				this.model.set({name: formInputs.filter('[name=name]').val(), email: formInputs.filter('[name=email]').val(), phone: formInputs.filter('[name=phone]').val(), image: form.find('img').attr('src')});
				this.model.save();
			}
			else{
				this.model = people.create({name: formInputs.filter('[name=name]').val(), email: form.filter('[name=email]').val(), phone: formInputs.filter('[name=phone]').val(), image: form.find('img').attr('src')});
			}
			this.close(e);
			e.preventDefault();
		},
		close: function(e){
			this.remove();
			this.overlay.remove();
			e.preventDefault();
		}
	});

	var masterView = Backbone.View.extend({
		el: jQuery('#content'),
		initialize: function(){

			this.listenTo(people, 'add', this.addOne);
			this.listenTo(people, 'reset', this.addAll);
			this.listenTo(people, 'all', this.render);
			
			people.fetch();
		},
		events: {
			'click .views a.grid': 'grid',
			'click .views a.list': 'list'
		},
		render: function(){
			
			return this;
		},
		addAll: function(item){
			people.each(this.renderEl, this);
		},
		addOne: function(item, i){
			item.set({id: item.attributes._id});
			var view = new personView({model: item});
			this.$el.find('#list-of-people').append(view.render().el);
		},
		grid: function(e){
			this.$el.find('#main').removeClass('list-view');
			e.preventDefault();
		},
		list: function(e){
			this.$el.find('#main').addClass('list-view');
			e.preventDefault();
		}
	});

	var mainApp = new masterView;
	
	jQuery('.link-add-person').click(function(e){
		new modalView({model: new personModel});
		e.preventDefault();
	});
	

	jQuery('.link-save').click(function(e){
	
		jQuery.ajax({
			url: '/save',
			type: 'POST',
			dataType: 'text'
		});
		e.preventDefault();
	});
}

jQuery(function(){
	initPage();
	calcHeight();
});

function calcHeight(){
	jQuery('#content').height(jQuery(window).height()-172);
}

jQuery(window).resize(calcHeight);