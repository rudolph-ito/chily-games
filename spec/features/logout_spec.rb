require 'spec_helper'

describe 'Logout' do
  before do
    sign_in
    visit invariants_path
  end

  it 'redirects to referrer' do
    click_on 'Sign Out'
    expect(page).to have_content 'Signed out successfully.'
    expect(current_path).to eql invariants_path
  end
end
