require 'spec_helper'

describe 'Login' do
  let(:password) { 'my_password' }
  let(:path) { user_session_path }
  let!(:user) { create(:user, password: password, password_confirmation: password) }

  it 'with username' do
    post path, user: { login: user.username, password: password }
    response.should redirect_to root_path
    flash[:notice].should == "Signed in successfully."
  end

  it 'with email' do
    post path, user: { login: user.email, password: password }
    response.should redirect_to root_path
    flash[:notice].should == "Signed in successfully."
  end

  it 'invalid password' do
    post path, user:  { login: user.email, password: 'invalid' }
    response.status.should == 200
    flash[:alert].should == "Invalid username/email or password."
  end

  it 'invalid username' do
    post path, user: { login: 'invalid', password: 'invalid' }
    response.status.should == 200
    flash[:alert].should == "Invalid username/email or password."
  end

  it 'nothing passed in' do
    post path, user: { }
    response.status.should == 200
    flash[:alert].should == "Invalid username/email or password."
  end
end