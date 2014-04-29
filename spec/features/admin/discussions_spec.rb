require 'spec_helper'

describe 'admin discussions' do
  before do
    sign_in admin: true
  end

  describe 'index' do
    before { create_list :discussion, 3 }

    it 'succeeds' do
      visit admin_discussions_path
    end
  end

  describe 'new/create' do
    it 'creates and redirects' do
      visit new_admin_discussion_path

      fill_in 'Title', with: 'a'
      fill_in 'Description', with: 'b'
      click_on 'Create'

      expect(page).to have_content 'Discussion was successfully created.'
    end
  end

  describe 'show/edit/update' do
    let(:discussion) { create :discussion, title: 'old' }

    it 'updates and redirects' do
      visit admin_discussion_path(discussion)
      click_on 'Edit Discussion'

      fill_in 'Title', with: 'new'
      click_on 'Update'

      expect(page).to have_content 'new'
      expect(page).to_not have_content 'old'
      expect(page).to have_content 'Discussion was successfully updated.'
    end
  end

  describe 'destroy' do
    let(:discussion) { create :discussion }

    it 'succeeds' do
      visit admin_discussion_path(discussion)
      click_on 'Delete Discussion'
      page.driver.browser.switch_to.alert.accept

      expect(page).to have_content 'Discussion was successfully destroyed.'
    end
  end
end
