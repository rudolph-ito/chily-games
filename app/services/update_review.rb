class UpdateReview
  attr_accessor :variant, :user, :rating, :comment

  def initialize(variant, user, rating, comment)
    @variant = variant
    @user = user
    @rating = rating
    @comment = comment
  end

  def call
    update_or_create_rating
    update_or_create_comment
  end

  private

  def update_or_create_rating
    current_rating ? update_rating : create_rating
  end

  def current_rating
    @current_rating ||= user.ratings.find_by(variant_id: variant.id)
  end

  def update_rating
    current_rating.update_attributes(value: rating)
  end

  def create_rating
    user.ratings.create(value: rating, variant_id: variant.id)
  end

  def update_or_create_comment
    current_comment ? update_comment : create_comment
  end

  def review_topic
    @review_topic ||= variant.topics.find_by(title: 'Reviews')
  end

  def current_comment
    @current_comment ||= review_topic.comments.find_by(user_id: user.id)
  end

  def update_comment
    current_comment.update_attributes(text: comment)
  end

  def create_comment
    review_topic.comments.create(text: comment, user_id: user.id)
  end
end
