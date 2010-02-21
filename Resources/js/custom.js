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
		$('#loggedInButtons').show(); //show logged in buttons
		notification_dialog("Login Success", "Logged in successfully");
		Twitter.home_timeline();
	}

	function notification_dialog(title, msg)	{
		var notificationDialog = Titanium.Notification.createNotification(window);
		notificationDialog.setTitle(title+" [tweetrics]");
		notificationDialog.setMessage(msg);
		notificationDialog.show();
	}
	
	function after_load_content(){
		// set tooltip style
		$('.pointer').tipsy({fade: true, gravity: 'e'});
		// set delete btn confirmation
	    $('.deleteUpdate').confirm({
            dialogShow:'fadeIn',
            dialogSpeed:'slow',
            wrapper:'<span class="confirmationBox"></span>',
            msg: 'Are you sure? ',
            buttons: {
                wrapper:'<button></button>',
                separator:'  '
            } 
        });
        // set retweet btn confirmation
        $('.retweetUpdate').confirm({
            dialogShow:'fadeIn',
            dialogSpeed:'slow',
            wrapper:'<span class="confirmationBox"></span>',
            msg: 'Retweet to your followers? ',
            buttons: {
                wrapper:'<button></button>',
                separator:'  '
            } 
        });
	}
	
	function parse_text(text){
	    var url_regexp = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi;
        $('#mainCol h2').each(function(){
            var thisText = $(this).text();
            var anchorText = thisText.replace(/ /g, "-");
            var anchorLink = '<a name="' + anchorText + '"></a>';
            var anchorText = '<a href="#' + anchorText + '">' + thisText + '</a>';
            $(this).before(anchorLink);
            $(anchorText).appendTo('p.subNav');
        });
	    return text;
	}
	return   {
		home_timeline: function(){
			var auth = make_basic_auth(username, password);
			var url = "http://api.twitter.com/1/statuses/home_timeline.json";
			var tplate = $.template('\
			<div id="tweet_${tweet_row_id}" class="tweetPost container">\
			<span class="dNone">${id}</span>\
			<div class="span-2">\
			<img src="${profile_image}" alt="Profile Pic"/>\
			</div>\
			<div class="span-9 last">\
			<a target="ti:systembrowser" href="http://twitter.com/${profile_screen_name}" title="Go to profile for ${profile_screen_name}">${profile_screen_name}</a>:\
			${text}\
			</div>\
			<span id="retweetOrDeleteUpdate${id}" class="pAll10 fRight"></span>\
			<span id="replyUpdate${id}" class="pAll10 fRight"></span>\
			<div class="span-11 last">\
			</div> \
			</div>');
			var delico = $.template('<img id="${id}" class="deleteUpdate pointer statusBtn" title="delete" src="images/icons/minus-circle-frame.png"/>');
			var retweetico = $.template('<img id="${id}" class="retweetUpdate pointer statusBtn" title="retweet" src="images/icons/arrow-repeat.png"/>');
			var replyico = $.template('<img id="${profile_screen_name}" class="replyUpdate pointer statusBtn" title="reply to ${profile_screen_name}" src="images/icons/arrow-curve-180-left.png"/>');
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
							text: parse_text(valu.text),
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
					after_load_content();
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
					Twitter.periodical_home_timeline();
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
					Twitter.periodical_home_timeline();
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

		periodical_home_timeline: function(){
			page = 1;
			sinceId = $('#tweet_0 span').text();
			$('#content').html('');
			notification_dialog("Info", "Checking for new updates");
			Twitter.home_timeline();
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
			Twitter.home_timeline();
		});

		// refresh statushes page
		$('#refresh').click(function()
		{
            var page = Twitter.get_page();
            Twitter.set_page(null);
            $('#content').html('');
			Twitter.home_timeline();
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

	setInterval("if (Twitter.logged_in()) {Twitter.periodical_home_timeline();}", 500000);

