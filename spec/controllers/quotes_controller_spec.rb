require 'spec_helper'

describe QuotesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      expect(response.status).to eql 200
    end
  end

  describe 'show' do
    let(:quote) { create :quote }

    it 'succeeds' do
      get :show, id: quote.id
      expect(response.status).to eql 200
    end
  end
end