object @variant

node :rating do |variant|
  current_user.ratings.where(variant_id: variant.id).pluck(:value).first
end

node :comment do |variant|
  review_topic = variant.topics.find_by(title: 'Reviews')
  current_user.comments.where(topic_id: review_topic.try(:id)).pluck(:text).first
end
