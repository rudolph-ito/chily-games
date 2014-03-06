require 'spec_helper'

describe CommentsController do
  let!(:topic) { create(:topic) }

  describe 'create' do
    let(:valid_attributes) { { text: 'text' } }

    context 'when signed in', :signed_in do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, topic_id: topic.id, comment: valid_attributes
            response.should redirect_to topic
          }.to change(Comment, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, topic_id: topic.id, comment: valid_attributes.merge(text: '')
            response.should redirect_to topic
          }.to change(Comment, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, topic_id: topic.id, comment: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(Comment, :count).by(0)
      end
    end
  end
end
