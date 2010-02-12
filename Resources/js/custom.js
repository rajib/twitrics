Twitter = function() {
	// user credentials
	var username, password, screen_name;
	// since_id
	var sinceId;
	// global page_no
	var page;
	// is already logged in
	var login;

	function  make_basic_auth(user, password) {
		var tok = user + ':' + password;
		var hash = Base64.encode(tok);
		return "Basic " + hash;											
	}

	function switch_to_main()  {
		login = true;
		$('#loginForm').hide(); //disappear login form
		$('#loggedInBlock').show(); //show main content after login success
		notification_dialog("Login Success", "Logged in successfully");
		Twitter.public_timeline();
	}

	function notification_dialog(title, msg)	{
		var notificationDialog = Titanium.Notification.createNotification(window);
		notificationDialog.setTitle(title+" [tweetrics]");
		notificationDialog.setMessage(msg);
		notificationDialog.show();
	}
	return   {
		public_timeline: function(){
			var auth = make_basic_auth(username, password);
			var url = "http://api.twitter.com/1/statuses/home_timeline.json";
			var tplate = $.template('\
			<div id="tweet_${tweet_row_id}" class="tweetPost container">\
			<span class="dNone">${id}</span>\
			<div class="span-2">\
			<img src="${profile_image}" alt="Profile Pic"/>\
			</div>\
			<div class="span-9 last">\
			<strong>${profile_screen_name}:</strong>\
			${text}\
			</div>\
			<span id="retweetOrDeleteUpdate${id}" class="pAll10 fRight"></span>\
			<span id="replyUpdate${id}" class="pAll10 fRight"></span>\
			<div class="span-11 last">\
			</div> \
			</div>');
			var delico = $.template('<img id="${id}" class="deleteUpdate pointer" title="delete" src="images/icons/minus-circle-frame.png"/>');
			var retweetico = $.template('<img id="${id}" class="retweetUpdate pointer" title="retweet" src="images/icons/arrow-repeat.png"/>');
			var replyico = $.template('<img id="${profile_screen_name}" class="replyUpdate pointer" title="reply" src="images/icons/arrow-curve-180-left.png"/>');
			$.ajax({
				type: "GET",
				url: url,
				data: {page:(page == null) ? 1 : page},
				dataType: 'json',
				beforeSend: function(req)  {
					req.setRequestHeader('Authorization', auth);
				},
				success: function(json) {
					$.each( json, function(name, valu){
						$('#content').append( tplate, {
							profile_image: valu.user.profile_image_url,
							profile_screen_name: valu.user.screen_name,
							text: valu.text,
							id: valu.id,
							tweet_row_id: name
						});
						if (screen_name == valu.user.screen_name) {
							$('#retweetOrDeleteUpdate'+valu.id).html( delico, {
								id: valu.id
							});
						} else {
							$('#retweetOrDeleteUpdate'+valu.id).html( retweetico, {
								id: valu.id
							});
							$('#replyUpdate'+valu.id).html( replyico, {
								profile_screen_name: valu.user.screen_name
							});
						}
					});
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					notification_dialog("Error", XMLHttpRequest.responseText);
				}
			});
		},

		update_status: function(status_msg){
			var auth = make_basic_auth(username, password);
			var url = "http://twitter.com/statuses/update.json";
			$.ajax({
				type: "POST",
				url: url,
				data: {status: status_msg},
				dataType: 'json',
				beforeSend: function(req)  {
					req.setRequestHeader('Authorization', auth);
				},
				success: function(json) {
					Twitter.periodical_public_timeline();
					$('#statusUpdateForm').resetForm();
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					notification_dialog("Error", XMLHttpRequest.responseText);
				}
			});
		},

		delete_status: function(id){
			var auth = make_basic_auth(username, password);
			var url = "http://twitter.com/statuses/destroy/"+id+".json"
			$.ajax({
				type: "DELETE",
				url: url,
				dataType: 'json',
				beforeSend: function(req)  {
					req.setRequestHeader('Authorization', auth);
				},
				success: function(json) {
					Twitter.periodical_public_timeline();
					notification_dialog("Info", "Update deleted");
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					notification_dialog("Error", XMLHttpRequest.responseText);
				}
			});
		},

		retweet_status: function(id){
			var auth = make_basic_auth(username, password);
			var url = "http://api.twitter.com/1/statuses/retweet/"+id+".json"
			$.ajax({
				type: "POST",
				url: url,
				dataType: 'json',
				beforeSend: function(req)  {
					req.setRequestHeader('Authorization', auth);
				},
				success: function(json) {
					notification_dialog("Info", "Update retweeted");
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					notification_dialog("Error", XMLHttpRequest.responseText);
				}
			});
		},

		periodical_public_timeline: function(){
			page = 1;
			sinceId = $('#tweet_0 span').text();
			$('#content').html('');
			notification_dialog("Info", "Checking for new updates");
			Twitter.public_timeline();
		},

		set_page: function(p){
			page = p;
			return page;
		},

		get_page: function(){
			return page;
		},

		logged_in: function(){
			return login;
		},

		login: function(){
			username = $('#username').val();
			password = $('#password').val();
			var auth = make_basic_auth(username, password);
			var url = "http://twitter.com/account/verify_credentials.json";

			$.ajax({
				url: url,
				method: 'GET',
				dataType: 'json',
				beforeSend: function(req)  {
					req.setRequestHeader('Authorization', auth);
				},
				success: function(json, textStatus){
					switch_to_main();
					screen_name = json.screen_name;
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					notification_dialog("Login Failed", XMLHttpRequest.responseText);
				}
			});
		},
	};
	}();
	
	
	Utility = function(){
        return {
            show_dm_form: function(profile_screen_name){
                var replyto_title = $.template('Reply to ${profile_screen_name}:');
                $('#statusUpdateForm').hide();
                $('#replyForm').show();
                $('#replyTo').html( replyto_title, {
                    profile_screen_name: profile_screen_name
                });
                $('#replyForm #replyInput').append(profile_screen_name);
            }
        }
	}();


	$(function(){
		// More tweets button
		$('#pagination').click(function(e)  {
			e.preventDefault();
			var page = Twitter.get_page();
			Twitter.set_page((page == null) ? 2 : page + 1);
			Twitter.public_timeline();
		});

		//Titanium.App.exit();
		$('#close').click(function()
		{
			Titanium.UI.currentWindow.close();
		});

		//Titanium.App.minimize();
		$('#minimize').click(function()
		{
			Titanium.UI.currentWindow.move();
		});

		// Check if the status update textarea is empty or not
		$('#statusUpdateForm #statusUpdateInput').keyup(function(){
			if ($.trim($('#statusUpdateForm #statusUpdateInput').val()).length > 0) {
				$('#updateSubmit').attr('disabled', false);
			}else if (($('#statusUpdateForm #statusUpdateInput').val().length < 1)) {
				$('#updateSubmit').attr('disabled', true);
			}
		});
		
		// Check if the status update textarea is empty or not
		$('#replyForm #replyInput').live('keyup', function(){
            if (($('#replyForm #replyInput').val().length < 1)) {
				$('#replyForm').hide();
				$('#statusUpdateForm').show();
			}
		});

		// Turns the form to AjaxForm
		$('#statusUpdateForm').ajaxForm(function() {
			Twitter.update_status($('#statusUpdateForm #statusUpdateInput').val());
		});
		
		// Turns the reply form to AjaxForm
		$('#replyForm').ajaxForm(function() {
			Twitter.update_status($('#replyForm #replyInput').val());
		});

		// Global ajax activity indicators.
		$(document).ajaxStart(function(){
			$('#progress').show();
		}).ajaxStop(function(){
			$('#progress').hide();
		});

		$('.deleteUpdate').live('click', function(){
			Twitter.delete_status(this.id);
		});

		$('.retweetUpdate').live('click', function(){
			Twitter.retweet_status(this.id);
		});	
		
		$('.replyUpdate').live('click', function(){
			profile_screen_name = "@"+this.id+" ";
			Utility.show_dm_form(profile_screen_name);
		});	
	});


	setInterval("if (Twitter.logged_in()) {Twitter.periodical_public_timeline();}", 100000);
