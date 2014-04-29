require 'spec_helper'

describe 'admin users' do
  before do
    sign_in admin: true
  end

  describe 'index' do
    before { create_list :user, 3 }

    it 'succeeds' do
      visit admin_users_path
    end
  end

  describe 'new/create' do
    it 'creates and redirects' do
      visit new_admin_user_path

      fill_in 'Username', with: 'a'
      fill_in 'Email', with: 'a@b.c'
      fill_in 'Password', with: '12345678', match: :prefer_exact
      fill_in 'Password confirmation', with: '12345678'
      click_on 'Create'

      expect(page).to have_content 'User was successfully created.'
    end
  end

  describe 'show/edit/update' do
    let(:user) { create :user, username: 'old' }

    it 'updates and redirects' do
      visit admin_user_path(user)
      click_on 'Edit User'

      fill_in 'Username', with: 'new'
      click_on 'Update'

      expect(page).to have_content 'new'
      expect(page).to_not have_content 'old'
      expect(page).to have_content 'User was successfully updated.'
    end
  end

  describe 'destroy' do
    let(:user) { create :user }

    it 'succeeds' do
      visit admin_user_path(user)
      click_on 'Delete User'
      page.driver.browser.switch_to.alert.accept

      expect(page).to have_content 'User was successfully destroyed.'
    end
  end
end
