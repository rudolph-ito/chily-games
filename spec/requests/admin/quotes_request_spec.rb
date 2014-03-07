require 'spec_helper'

describe 'admin quotes' do
  before do
    sign_in_admin
  end

  describe 'index' do
    before { create_list :quote, 3 }

    it 'succeeds' do
      get '/admin/quotes'
      expect(response.status).to eql 200
    end
  end

  describe 'new' do
    it 'succeeds' do
      get '/admin/quotes/new'
      expect(response.status).to eql 200
    end
  end

  describe 'create' do
    let(:valid_attributes) { {
      book_number: 4, book_name: 'A Feast for Crows',
      chapter_number: 13, chapter_name: 'The Soiled Knight',
      description: 'Introduction', number: 1, text: '*Cyvasse*, the game was called.'
    } }

    it 'creates and redirects' do
      expect {
        post '/admin/quotes', quote: valid_attributes
        expect(response).to redirect_to [:admin, Quote.last]
      }.to change(Quote, :count).by(1)
    end
  end

  describe 'edit' do
    let(:quote) { create :quote }

    it 'succeeds' do
      get "/admin/quotes/#{quote.id}/edit"
      expect(response.status).to eql 200
    end
  end

  describe 'update' do
    let(:quote) { create :quote, description: 'old' }

    it 'updates and redirects to quote' do
      put "/admin/quotes/#{quote.id}", quote: { description: 'new' }
      expect(quote.reload.description).to eql 'new'
      expect(response).to redirect_to [:admin, quote]
    end
  end

  describe 'destroy' do
    let!(:quote) { create :quote }

    it 'destroys and redirects to quotes' do
      expect{
        delete "/admin/quotes/#{quote.id}"
        expect(response).to redirect_to [:admin, :quotes]
      }.to change(Quote, :count).by(-1)
    end
  end
end
