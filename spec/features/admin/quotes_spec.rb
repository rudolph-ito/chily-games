require 'spec_helper'

describe 'admin quotes' do
  before do
    sign_in admin: true
  end

  describe 'index' do
    before { create_list :quote, 3 }

    it 'succeeds' do
      visit admin_quotes_path
    end
  end

  describe 'new/create' do
    it 'creates and redirects' do
      visit new_admin_quote_path

      fill_in 'Book number', with: '4'
      fill_in 'Book name', with: 'A Feast for Crows'
      fill_in 'Chapter number', with: '13'
      fill_in 'Chapter name', with: 'The Soiled Knight'
      fill_in 'Description', with: 'Introduction'
      fill_in 'Number', with: '1'
      fill_in 'Text', with: '*Cyvasse*, the game was called.'
      click_on 'Create Quote'

      expect(page).to have_content 'Quote was successfully created.'
    end
  end

  describe 'show/edit/update' do
    let(:quote) { create :quote, book_name: 'old' }

    it 'updates and redirects' do
      visit admin_quote_path(quote)
      click_on 'Edit Quote'

      fill_in 'Book name', with: 'new'
      click_on 'Update Quote'

      expect(page).to have_content 'new'
      expect(page).to_not have_content 'old'
      expect(page).to have_content 'Quote was successfully updated.'
    end
  end

  describe 'destroy' do
    let(:quote) { create :quote }

    it 'succeeds' do
      visit admin_quote_path(quote)
      click_on 'Delete Quote'
      page.driver.browser.switch_to.alert.accept

      expect(page).to have_content 'Quote was successfully destroyed.'
    end
  end
end
