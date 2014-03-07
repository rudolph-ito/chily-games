require 'spec_helper'

describe 'admin discussions' do
  before do
    sign_in_admin
  end

  describe 'index' do
    before { create_list :discussion, 3 }

    it 'succeeds' do
      get '/admin/discussions'
      expect(response.status).to eql 200
    end
  end

  describe 'new' do
    it 'succeeds' do
      get '/admin/discussions/new'
      expect(response.status).to eql 200
    end
  end

  describe 'create' do
    let(:valid_attributes) { { title: 'discussion', description: 'a discussion' } }

    it 'creates and redirects' do
      expect {
        post '/admin/discussions', discussion: valid_attributes
        expect(response).to redirect_to [:admin, Discussion.last]
      }.to change(Discussion, :count).by(1)
    end
  end

  describe 'edit' do
    let(:discussion) { create :discussion }

    it 'succeeds' do
      get "/admin/discussions/#{discussion.id}/edit"
      expect(response.status).to eql 200
    end
  end

  describe 'update' do
    let(:discussion) { create :discussion, title: 'old' }

    it 'updates and redirects to discussion' do
      put "/admin/discussions/#{discussion.id}", discussion: { title: 'new' }
      expect(discussion.reload.title).to eql 'new'
      expect(response).to redirect_to [:admin, discussion]
    end
  end

  describe 'destroy' do
    let!(:discussion) { create :discussion }

    it 'destroys and redirects to discussions' do
      expect{
        delete "/admin/discussions/#{discussion.id}"
        expect(response).to redirect_to [:admin, :discussions]
      }.to change(Discussion, :count).by(-1)
    end
  end
end
