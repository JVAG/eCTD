$(function(){
  /* Validation of User Registration data*/
  $('#register').submit(function(evt){
    evt.preventDefault();
    let user = {};
    user.email = $('#email').val();
    user.firstName = $('#firstName').val();
    user.lastName = $('#lastName').val();
    user.password = $('#password').val();
    user.cpassword = $('#confirmPassword').val();
    user.role = $('#userRole option:selected').val();
    let errorsPresent = false;
    $('#errors').empty();
    if( user.email.trim().length == 0 ){
        $('#errors').append('<li>Email can not be empty</li>');
        errorsPresent = true;
    }
    if( user.firstName.trim().length == 0 ){
        $('#errors').append('<li>First Name can not be empty</li>');
        errorsPresent = true;
    }
    if( user.password.trim().length == 0 ){
        $('#errors').append('<li>Password can not be empty</li>');
        errorsPresent = true;
    }
    if( user.password.trim() !==  user.cpassword.trim() ){
        $('#errors').append('<li>Password and Confirm-Password should match</li>');
        errorsPresent = true;
    }

    if( !errorsPresent ){
      $.post(evt.target.action,user,function(result){
        window.location = "/home";
      },'json');
    }
  });
})
