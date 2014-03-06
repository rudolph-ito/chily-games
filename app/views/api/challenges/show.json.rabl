object @challenge
attributes :challenger_id, :challenged_id, :id, :play_as, :variant_id
node(:challenger) { |c| c.challenger.username }
node(:variant) { |c| c.variant.to_s }
