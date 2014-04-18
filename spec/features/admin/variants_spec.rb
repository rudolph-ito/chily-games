require 'spec_helper'

describe 'admin users' do
  before do
    sign_in admin: true
  end

  describe 'index' do
    before { create_list :variant, 3 }

    it 'succeeds' do
      visit admin_variants_path
    end
  end

  describe 'destroy' do
    let!(:variant) { create :variant }

    it 'succeeds' do
      visit admin_variants_path
      click_on 'Delete'
      page.driver.browser.switch_to.alert.accept

      expect(page).to have_content 'Variant was successfully destroyed.'
    end
  end
end
