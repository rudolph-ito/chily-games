require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/services/update_review.rb'

describe UpdateReview do
  let(:update_review) { UpdateReview.new(variant, user, rating, comment) }
  let(:variant) { double :variant, id: 1, topics: variant_topics }
  let(:user) { double :user, id: 2, ratings: user_ratings }
  let(:rating) { '5' }
  let(:comment) { 'The dragon is overpowered' }

  let(:variant_topics) { double :variant_topics, find_by: nil, create: nil }
  let(:variant_topic) { double :variant_topic, comments: topic_comments }
  let(:topic_comments) { double :topic_comments, find_by: nil, create: nil }
  let(:user_comment) { double :user_comment, update_attributes: nil }

  let(:user_ratings) { double :user_ratings, find_by: nil, create: nil }
  let(:user_rating) { double :user_rating, update_attributes: nil }

  before { variant_topics.stub(:find_by).with(title: 'Reviews').and_return(variant_topic) }

  describe '#call' do
    context 'rating exists' do
      before { user_ratings.stub(:find_by).with(variant_id: variant.id).and_return(user_rating) }

      it 'updates rating' do
        update_review.call
        expect(user_rating).to have_received(:update_attributes).with(value: '5')
      end
    end

    context 'rating does not exist' do
      it 'creates rating' do
        update_review.call
        expect(user_ratings).to have_received(:create).with(value: '5', variant_id: variant.id)
      end
    end

    context 'comment exists' do
      before { topic_comments.stub(:find_by).with(user_id: user.id).and_return(user_comment) }

      it 'updates comment' do
        update_review.call
        expect(user_comment).to have_received(:update_attributes).with(text: 'The dragon is overpowered')
      end
    end

    context 'comment does not exist' do
      it 'creates comment' do
        update_review.call
        expect(topic_comments).to have_received(:create).with(text: 'The dragon is overpowered', user_id: user.id)
      end
    end
  end
end
