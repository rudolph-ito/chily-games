require 'spec_helper'

describe 'Sign up' do
  before { visit new_user_registration_path }

  context 'with valid params' do
    before do
      fill_in 'Username', with: 'user'
      fill_in 'Email', with: 'user@cyvasse.com'
      fill_in 'Password', with: '12345678', match: :prefer_exact
      fill_in 'Confirm Password', with: '12345678'
      click_on 'Sign up'
    end

    it 'succeeds' do
      expect(page).to have_content  'Welcome! You have signed up successfully.'
    end
  end

  context 'with invalid params' do
    before do
      click_on 'Sign up'
    end

    it 'succeeds' do
      expect(page).not_to have_content  'Welcome! You have signed up successfully.'
    end
  end
end
