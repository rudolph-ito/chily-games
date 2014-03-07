require 'spec_helper'

describe 'admin piece types' do
  before do
    sign_in_admin
  end

  describe 'index' do
    before { create_list :piece_type, 3 }

    it 'succeeds' do
      get '/admin/piece_types'
      expect(response.status).to eql 200
    end
  end

  describe 'new' do
    it 'succeeds' do
      get '/admin/piece_types/new'
      expect(response.status).to eql 200
    end
  end

  describe 'create' do
    let(:valid_attributes) { {
      alabaster_image: Rack::Test::UploadedFile.new('spec/support/fake_image.svg'),
      name: 'test',
      onyx_image: Rack::Test::UploadedFile.new('spec/support/fake_image.svg')
    } }

    it 'creates and redirects' do
      expect {
        post '/admin/piece_types', piece_type: valid_attributes
        expect(response).to redirect_to [:admin, PieceType.last]
      }.to change(PieceType, :count).by(1)
    end
  end

  describe 'edit' do
    let(:piece_type) { create :piece_type }

    it 'succeeds' do
      get "/admin/piece_types/#{piece_type.id}/edit"
      expect(response.status).to eql 200
    end
  end

  describe 'update' do
    let(:piece_type) { create :piece_type, name: 'old' }

    it 'updates and redirects to piece_type' do
      put "/admin/piece_types/#{piece_type.id}", piece_type: { name: 'new' }
      expect(piece_type.reload.name).to eql 'new'
      expect(response).to redirect_to [:admin, piece_type]
    end
  end

  describe 'destroy' do
    let!(:piece_type) { create :piece_type }

    it 'destroys and redirects to piece_types' do
      expect{
        delete "/admin/piece_types/#{piece_type.id}"
        expect(response).to redirect_to [:admin, :piece_types]
      }.to change(PieceType, :count).by(-1)
    end
  end
end
