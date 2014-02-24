require 'spec_helper'

describe QuotesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end

  describe 'new' do
    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :new
        response.status.should == 200
      end
    end

    context 'when signed in', :signed_in do
      it 'succeeds' do
        get :new
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :new
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'create' do
    let(:valid_attributes) { { book_number: 4, book_name: 'A Feast for Crows', chapter_number: 13, chapter_name: 'The Soiled Knight', description: 'Introduction', number: 1, text: '*Cyvasse*, the game was called.' } }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, quote: valid_attributes
            #response.should redirect_to Quote.last
          }.to change(Quote, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, quote: valid_attributes.merge(number: nil)
            response.should render_template 'new'
          }.to change(Quote, :count).by(0)
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to login' do
        expect {
          post :create, quote: valid_attributes
          response.should redirect_to root_path
        }.to change(Quote, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, quote: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(Quote, :count).by(0)
      end
    end
  end

  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end

  describe 'edit' do
    let(:quote) { create :quote }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'succeeds' do
        get :edit, id: quote.id
        response.status.should == 200
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        get :edit, id: quote.id
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: quote.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:quote) { create :quote, number: 1 }

    context 'when signed in as admin', :signed_in_as_admin do
      context 'with valid attributes' do
        it 'updates and redirects to quote' do
          put :update, id: quote.id, quote: { number: 2 }
          quote.reload.number.should == 2
          response.should redirect_to quote
        end
      end

      context 'with invalid attributes' do
        it 'renders edit' do
          put :update, id: quote.id, quote: { number: nil }
          quote.reload.number.should == 1
          response.should render_template 'edit'
        end
      end
    end

    context 'when signed in', :signed_in do
      it 'redirects to root' do
        put :update, id: quote.id, quote: { number: 2 }
        quote.reload.number.should == 1
        response.should redirect_to root_path
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: quote.id, quote: { number: 'new' }
        quote.reload.number.should == 1
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:quote) { create :quote }

    context 'when signed in as admin', :signed_in_as_admin do
      it 'destroys and redirects to quotes' do
        expect{
          delete :destroy, id: quote.id
          response.should redirect_to quotes_path
        }.to change(Quote, :count).by(-1)
      end
    end

     context 'when signed in', :signed_in do
      it 'redirects to root' do
        expect{
          put :update, id: quote.id
          response.should redirect_to root_path
        }.to change(Quote, :count).by(0)
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: quote.id
          response.should redirect_to new_user_session_path
        }.to change(Quote, :count).by(0)
      end
    end
  end
end
