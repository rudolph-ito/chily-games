require 'spec_helper'

describe 'Login' do
  let(:user) { create(:user) }

  context 'with username' do
    it 'succeeds' do
      sign_in_with(user.username, user.password)
      expect(page).to have_content 'Signed in successfully.'
    end
  end

  context 'with email' do
    it 'succeeds' do
      sign_in_with(user.email, user.password)
      expect(page).to have_content 'Signed in successfully.'
    end
  end

  context 'invalid' do
    it 'fails' do
      sign_in_with('', '')
      expect(page).to have_content 'Invalid username/email or password.'
    end
  end
end
