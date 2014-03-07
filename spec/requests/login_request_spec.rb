require 'spec_helper'

describe 'Login' do
  let(:password) { 'my_password' }
  let(:path) { user_session_path }
  let!(:user) { create(:user, password: password, password_confirmation: password) }

  it 'with username' do
    post path, user: { login: user.username, password: password }
    expect(response).to redirect_to root_path
    expect(flash[:notice]).to eql "Signed in successfully."
  end

  it 'with email' do
    post path, user: { login: user.email, password: password }
    expect(response).to redirect_to root_path
    expect(flash[:notice]).to eql "Signed in successfully."
  end

  it 'invalid password' do
    post path, user:  { login: user.email, password: 'invalid' }
    expect(response.status).to eql 200
    expect(flash[:alert]).to eql "Invalid username/email or password."
  end

  it 'invalid username' do
    post path, user: { login: 'invalid', password: 'invalid' }
    expect(response.status).to eql 200
    expect(flash[:alert]).to eql "Invalid username/email or password."
  end

  it 'nothing passed in' do
    post path, user: { }
    expect(response.status).to eql 200
    expect(flash[:alert]).to eql "Invalid username/email or password."
  end
end