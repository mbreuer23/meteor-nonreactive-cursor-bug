
Comments = new Mongo.Collection("comments");

// use case:  I only want to show a snapshot of current comments
// when the page is first rendered.
// If more comments are added, the user will have to manually refresh by clicking the button


if (Meteor.isClient) {

  Template.comments.onCreated(function() {

    var template = this;

    template.autorun(function() {
      var sub = template.subscribe("comments");

      if (sub.ready() ) {
        // mark subscription as ready
        Session.setDefault("ready", true);
      }
    });

    template.autorun(function() {
      // when subscription is ready, re-run the comments helper
      if (Session.equals("ready", true)) {
        console.log("subscription is ready");
        Session.setDefault("rerun", true);
      }
    });
  });

  Template.comments.helpers({
    comments: function () {
      console.log("re-running comments helper");
      Session.get("rerun"); // establish reactive dependency on "rerun" var

      // when using reactive:false, I get the following error in Firefox (other browsers untested)
      //    Exception from Tracker recompute function:
      //    Error: Bad index in range.getMember: 0
      // removing the {reactive: false} option gets ride of the bug
      // but doesn't lead to the desired behavior
      return Comments.find({},{sort: {createdAt: -1}, reactive: false});
    }
  });

  Template.comments.events({
    'click #rerun': function () {
      // increment the counter when button is clicked
      Session.set('rerun', !Session.get('rerun'));
    },
    'click #post' : function(event, template) {
      var title = "New comment";
      var content = $("input").val();

      Comments.insert({title: title, content: content, createdAt: new Date()});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {

    if (Comments.find().count() === 0) {
      for (i=1;i<10;i++) {
        Comments.insert({title: "Comment #" + i, content: "Dummy content", createdAt : new Date()});
      }
    }


    Meteor.publish("comments", function() {
      return Comments.find();
    });

  });
}
